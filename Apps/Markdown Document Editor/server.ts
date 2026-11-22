import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

interface UnknownTokenPayload {
  word: string;
  count: number;
  contexts: string[];
  docTitles: string[];
  kind?: 'flagged' | 'technical_candidate';
}

interface DocumentExcerptPayload {
  title: string;
  excerpt: string;
}

interface SmartSuggestionsRequestBody {
  unknownTokens?: UnknownTokenPayload[];
  documentExcerpts?: DocumentExcerptPayload[];
  existingCustomWords?: string[];
  totalDocumentsScanned?: number;
}

interface RawSuggestionItem {
  word?: string;
  sourceWord?: string;
  category?: string;
  reason?: string;
  occurrences?: number;
  confidence?: number;
  sampleContext?: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      const isRetryable = status === 429 || (typeof status === 'number' && status >= 500) || status === undefined;
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      const delayMs = 400 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/dictionary/smart-suggestions', async (req: Request, res: Response) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        res.status(400).json({
          error:
            'Gemini API key is not configured. Please check GEMINI_API_KEY in the Settings > Secrets panel.',
        });
        return;
      }

      const body = (req.body || {}) as SmartSuggestionsRequestBody;
      const unknownTokens = Array.isArray(body.unknownTokens) ? body.unknownTokens.slice(0, 80) : [];
      const documentExcerpts = Array.isArray(body.documentExcerpts)
        ? body.documentExcerpts.slice(0, 8)
        : [];
      const existingCustomWords = Array.isArray(body.existingCustomWords)
        ? body.existingCustomWords.slice(0, 500)
        : [];
      const totalDocumentsScanned = Number(body.totalDocumentsScanned || documentExcerpts.length || 0);

      if (unknownTokens.length === 0 && documentExcerpts.every((d) => !d.excerpt?.trim())) {
        res.json({
          summary: 'No unverified terms or technical jargon candidates were found across the scanned documents.',
          suggestions: [],
        });
        return;
      }

      const existingSet = new Set(existingCustomWords.map((w) => w.trim().toLowerCase()));

      const promptPayload = {
        totalDocumentsScanned,
        existingCustomDictionarySample: existingCustomWords.slice(0, 150),
        candidateTokensFromSpellChecker: unknownTokens.map((t) => ({
          token: t.word,
          occurrences: t.count,
          kind: t.kind || 'flagged',
          documents: t.docTitles.slice(0, 3),
          contexts: t.contexts.slice(0, 2),
        })),
        documentExcerpts: documentExcerpts.map((d) => ({
          title: d.title,
          excerpt: d.excerpt.slice(0, 800),
        })),
      };

      const systemInstruction = [
        'You are an intelligent spell-checker and technical lexicon assistant for Markora, a Markdown writing app.',
        'Analyze the candidate unknown words, repeated technical tokens, and Markdown document excerpts provided.',
        'Recommend high-value words the user should add to their personal custom dictionary.',
        'Classify each recommendation into one of four categories:',
        '1. "technical_jargon": valid specialized software, DevOps, AI, engineering, scientific, or domain jargon used in the documents (e.g., monorepo, langfuse, pgvector, kubectx, microfrontend).',
        '2. "brand_or_acronym": valid product names, libraries, frameworks, companies, or acronyms (e.g., markora, vercel, opentelemetry, trpc).',
        '3. "domain_term": valid niche, project-specific, or proper nouns/terminology appearing intentionally in the text.',
        '4. "misspelling_correction": if a candidate token is clearly a recurring typo/misspelling (e.g., "kubernetis" -> "kubernetes", "configuraton" -> "configuration", "markdwon" -> "markdown"), set sourceWord to the misspelled token and word to the CORRECTED canonical word to add/learn instead of adding the typo itself.',
        'Rules:',
        '- Every suggested "word" MUST be lowercase, single-word alphabetic (letters or apostrophe only, min 2 chars, no spaces/punctuation/digits).',
        '- NEVER suggest words already present in existingCustomDictionarySample.',
        '- Prioritize words that appear multiple times or are central to the document topic.',
        '- Return at most 15 high-signal suggestions sorted by usefulness.',
        '- Keep "summary" concise (1-2 sentences) and each "reason" concise (1 short sentence).',
      ].join('\n');

      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Analyze these documents and candidate tokens and return dictionary suggestions as JSON:\n${JSON.stringify(promptPayload)}`,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description: 'A brief 1-2 sentence overview of the writing domain and suggestions.',
                },
                suggestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: {
                        type: Type.STRING,
                        description: 'Canonical lowercase word to add to the custom dictionary.',
                      },
                      sourceWord: {
                        type: Type.STRING,
                        description: 'Original token seen in the document (differs from word if correcting a misspelling).',
                      },
                      category: {
                        type: Type.STRING,
                        description: 'One of: technical_jargon, brand_or_acronym, domain_term, misspelling_correction',
                      },
                      reason: {
                        type: Type.STRING,
                        description: 'Short explanation of why this word is useful to add.',
                      },
                      occurrences: {
                        type: Type.INTEGER,
                        description: 'Estimated occurrences in the scanned documents.',
                      },
                      confidence: {
                        type: Type.NUMBER,
                        description: 'Confidence score from 0.0 to 1.0.',
                      },
                      sampleContext: {
                        type: Type.STRING,
                        description: 'Short snippet or document title where it appeared.',
                      },
                    },
                    required: ['word', 'category', 'reason'],
                  },
                },
              },
              required: ['summary', 'suggestions'],
            },
          },
        })
      );

      const rawText = (response.text ?? '{}').trim();
      let parsed: { summary?: string; suggestions?: RawSuggestionItem[] } = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = { summary: 'Analysis completed.', suggestions: [] };
      }

      const tokenCountMap = new Map<string, UnknownTokenPayload>();
      for (const t of unknownTokens) {
        tokenCountMap.set(t.word.toLowerCase(), t);
      }

      const seenSuggested = new Set<string>();
      const cleanedSuggestions = (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
        .map((item) => {
          const normalizedWord = String(item.word || '')
            .trim()
            .toLowerCase()
            .replace(/^[^a-z']+|[^a-z']+$/g, '');
          const normalizedSource = String(item.sourceWord || normalizedWord)
            .trim()
            .toLowerCase();
          const matchedToken =
            tokenCountMap.get(normalizedSource) || tokenCountMap.get(normalizedWord);

          const validCategory = [
            'technical_jargon',
            'brand_or_acronym',
            'domain_term',
            'misspelling_correction',
          ].includes(String(item.category))
            ? String(item.category)
            : 'technical_jargon';

          return {
            word: normalizedWord,
            sourceWord: normalizedSource || normalizedWord,
            category: validCategory,
            reason: String(item.reason || 'Detected frequently in your documents.').trim(),
            occurrences:
              typeof item.occurrences === 'number' && item.occurrences > 0
                ? Math.round(item.occurrences)
                : matchedToken?.count || 1,
            confidence:
              typeof item.confidence === 'number'
                ? Math.min(1, Math.max(0, item.confidence))
                : 0.85,
            sampleContext:
              String(item.sampleContext || matchedToken?.contexts[0] || matchedToken?.docTitles[0] || '').trim(),
          };
        })
        .filter((item) => {
          if (!item.word || item.word.length < 2 || !/^[a-z]+(?:'[a-z]+)?$/.test(item.word)) {
            return false;
          }
          if (existingSet.has(item.word) || seenSuggested.has(item.word)) {
            return false;
          }
          seenSuggested.add(item.word);
          return true;
        });

      res.json({
        summary:
          typeof parsed.summary === 'string' && parsed.summary.trim()
            ? parsed.summary.trim()
            : `Found ${cleanedSuggestions.length} dictionary suggestion${cleanedSuggestions.length === 1 ? '' : 's'} from your documents.`,
        suggestions: cleanedSuggestions,
      });
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      const status = typeof errorObj?.status === 'number' ? errorObj.status : 500;
      const rawMessage = errorObj?.message || 'Failed to generate AI smart suggestions.';

      if (status === 400 || status === 403 || /API_KEY_INVALID|PERMISSION_DENIED/i.test(rawMessage)) {
        res.status(status).json({
          error:
            'Gemini API key is invalid or missing permissions. Please verify your key in the Settings > Secrets panel.',
        });
        return;
      }

      if (status === 429 || /RESOURCE_EXHAUSTED/i.test(rawMessage)) {
        res.status(429).json({
          error:
            'Gemini API rate limit or quota exceeded. Please wait a moment and try again, or check your quota in Settings > Secrets.',
        });
        return;
      }

      console.error('Smart suggestions API error:', err);
      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: rawMessage,
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Markora server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
