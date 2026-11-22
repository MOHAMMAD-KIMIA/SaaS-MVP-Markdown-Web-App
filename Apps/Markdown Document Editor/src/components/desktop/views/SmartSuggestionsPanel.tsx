// src/components/desktop/views/SmartSuggestionsPanel.tsx
import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Loader2,
  Plus,
  Check,
  X,
  Cpu,
  Wand2,
  Tag,
  BookMarked,
  AlertCircle,
  RefreshCw,
  FileText,
  CheckCheck,
} from 'lucide-react';
import { useDocumentStore } from '../../../stores/documentStore';
import { useSpellCheckStore } from '../../../stores/spellCheckStore';
import {
  collectDocumentCandidates,
  fetchSmartDictionarySuggestions,
  SmartDictionarySuggestion,
  SmartSuggestionCategory,
} from '../../../lib/spellcheck/smartSuggestions';
import { cn } from '../../../lib/utils/cn';

interface SmartSuggestionsPanelProps {
  onFeedback: (type: 'success' | 'info', message: string) => void;
}

type CategoryFilter = 'all' | SmartSuggestionCategory;

const CATEGORY_META: Record<
  SmartSuggestionCategory,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
  }
> = {
  technical_jargon: {
    label: 'Technical Jargon',
    icon: Cpu,
    badgeClass:
      'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
  },
  brand_or_acronym: {
    label: 'Brand / Acronym',
    icon: Tag,
    badgeClass:
      'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
  },
  domain_term: {
    label: 'Domain Term',
    icon: BookMarked,
    badgeClass:
      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  },
  misspelling_correction: {
    label: 'Misspelling Correction',
    icon: Wand2,
    badgeClass:
      'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
  },
};

export function SmartSuggestionsPanel({ onFeedback }: SmartSuggestionsPanelProps) {
  const documents = useDocumentStore((s) => s.documents);
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const updateDocumentContent = useDocumentStore((s) => s.updateDocumentContent);

  const userDictionary = useSpellCheckStore((s) => s.userDictionary);
  const ignoredWords = useSpellCheckStore((s) => s.ignoredWords);
  const addWord = useSpellCheckStore((s) => s.addWord);
  const addWordsBulk = useSpellCheckStore((s) => s.addWordsBulk);

  const [scope, setScope] = useState<'all' | 'active'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SmartDictionarySuggestion[]>([]);
  const [dismissedWords, setDismissedWords] = useState<Set<string>>(new Set());
  const [replacedPairs, setReplacedPairs] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const userWordSet = useMemo(() => new Set(userDictionary), [userDictionary]);

  const targetDocuments = useMemo(() => {
    if (scope === 'active' && activeDocumentId) {
      return documents.filter((d) => d.id === activeDocumentId);
    }
    return documents;
  }, [documents, activeDocumentId, scope]);

  const localScanStats = useMemo(() => {
    return collectDocumentCandidates(targetDocuments, userDictionary, ignoredWords);
  }, [targetDocuments, userDictionary, ignoredWords]);

  const visibleSuggestions = useMemo(() => {
    return suggestions.filter((item) => {
      if (dismissedWords.has(item.word)) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      return true;
    });
  }, [suggestions, dismissedWords, categoryFilter]);

  const unaddedVisibleSuggestions = useMemo(
    () => visibleSuggestions.filter((item) => !userWordSet.has(item.word)),
    [visibleSuggestions, userWordSet]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: 0,
      technical_jargon: 0,
      brand_or_acronym: 0,
      domain_term: 0,
      misspelling_correction: 0,
    };
    for (const item of suggestions) {
      if (dismissedWords.has(item.word)) continue;
      counts.all += 1;
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [suggestions, dismissedWords]);

  const handleAnalyze = async () => {
    if (targetDocuments.length === 0) {
      onFeedback('info', 'Create or open a document first to analyze words.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDismissedWords(new Set());
    setReplacedPairs(new Set());

    try {
      const result = await fetchSmartDictionarySuggestions({
        documents: targetDocuments,
        userDictionary,
        ignoredWords,
      });
      setSuggestions(result.suggestions);
      setSummary(result.summary);
      setHasAnalyzed(true);
      setCategoryFilter('all');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to generate smart suggestions right now.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSingle = (word: string) => {
    const added = addWord(word);
    if (added) {
      onFeedback('success', `Added "${word}" to your custom dictionary.`);
    } else {
      onFeedback('info', `"${word}" is already in your custom dictionary.`);
    }
  };

  const handleAddAllVisible = () => {
    const wordsToAdd = unaddedVisibleSuggestions.map((item) => item.word);
    if (wordsToAdd.length === 0) return;
    const added = addWordsBulk(wordsToAdd);
    onFeedback(
      added > 0 ? 'success' : 'info',
      added > 0
        ? `Added ${added} suggested word${added === 1 ? '' : 's'} to your custom dictionary.`
        : 'All visible suggestions are already in your dictionary.'
    );
  };

  const handleDismiss = (word: string) => {
    setDismissedWords((prev) => {
      const next = new Set(prev);
      next.add(word);
      return next;
    });
  };

  const handleFixMisspellingInDocs = (sourceWord: string, correctWord: string) => {
    if (!sourceWord || !correctWord || sourceWord === correctWord) return;
    const escaped = sourceWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    let docsUpdated = 0;

    for (const doc of targetDocuments) {
      if (!doc.content) continue;
      const nextContent = doc.content.replace(regex, (match) => {
        if (match === match.toUpperCase()) return correctWord.toUpperCase();
        if (match[0] && match[0] === match[0].toUpperCase()) {
          return correctWord[0].toUpperCase() + correctWord.slice(1);
        }
        return correctWord;
      });
      if (nextContent !== doc.content) {
        updateDocumentContent(doc.id, nextContent);
        docsUpdated++;
      }
    }

    setReplacedPairs((prev) => new Set(prev).add(`${sourceWord}->${correctWord}`));
    onFeedback(
      docsUpdated > 0 ? 'success' : 'info',
      docsUpdated > 0
        ? `Replaced "${sourceWord}" with "${correctWord}" in ${docsUpdated} document${docsUpdated === 1 ? '' : 's'}.`
        : `No occurrences of "${sourceWord}" needed replacement.`
    );
  };

  return (
    <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/5 via-card to-indigo-500/5 p-4 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>AI Smart Suggestions</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
              Document Intelligence
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Analyzes your documents for recurring technical jargon, domain terms, and common misspellings to recommend words for your dictionary.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <FileText className="w-3 h-3 text-primary" />
              <span>
                {targetDocuments.length} document{targetDocuments.length === 1 ? '' : 's'} in scope
              </span>
            </span>
            <span>•</span>
            <span>
              {localScanStats.totalCandidates} unverified or jargon token
              {localScanStats.totalCandidates === 1 ? '' : 's'} detected
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                scope === 'all'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All Docs ({documents.length})
            </button>
            <button
              type="button"
              onClick={() => setScope('active')}
              disabled={!activeDocumentId}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors disabled:opacity-40',
                scope === 'active'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Active Doc
            </button>
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading || targetDocuments.length === 0}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : hasAnalyzed ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-analyze Docs</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze &amp; Suggest Words</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="font-medium">Could not complete AI analysis</div>
            <div className="opacity-90">{error}</div>
          </div>
        </div>
      )}

      {hasAnalyzed && !isLoading && !error && (
        <div className="space-y-3 pt-1 border-t border-border/60 animate-in fade-in duration-200">
          {summary && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-background/80 rounded-lg border border-border px-3 py-2">
              <span className="text-foreground/90">{summary}</span>
              {unaddedVisibleSuggestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddAllVisible}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shrink-0 self-start sm:self-auto"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Add All ({unaddedVisibleSuggestions.length})</span>
                </button>
              )}
            </div>
          )}

          {categoryCounts.all > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['all', 'All'],
                  ['technical_jargon', 'Technical Jargon'],
                  ['brand_or_acronym', 'Brands & Acronyms'],
                  ['domain_term', 'Domain Terms'],
                  ['misspelling_correction', 'Misspellings'],
                ] as const
              ).map(([cat, label]) => {
                const count = categoryCounts[cat];
                if (cat !== 'all' && count === 0) return null;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors',
                      categoryFilter === cat
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>{label}</span>
                    <span className="font-mono opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {visibleSuggestions.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              {suggestions.length === 0
                ? 'No new jargon or spelling additions needed—your dictionary already covers these documents well.'
                : 'No suggestions left in this filter.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {visibleSuggestions.map((item) => {
                const meta = CATEGORY_META[item.category] || CATEGORY_META.technical_jargon;
                const CategoryIcon = meta.icon;
                const isAlreadyAdded = userWordSet.has(item.word);
                const isCorrection =
                  item.category === 'misspelling_correction' &&
                  item.sourceWord &&
                  item.sourceWord !== item.word;
                const wasReplaced = replacedPairs.has(`${item.sourceWord}->${item.word}`);

                return (
                  <div
                    key={item.word}
                    className={cn(
                      'rounded-lg border p-3 bg-background/90 flex flex-col justify-between gap-2.5 transition-colors',
                      isAlreadyAdded
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          {isCorrection && (
                            <>
                              <span className="font-mono text-xs line-through text-red-500/80 px-1.5 py-0.5 rounded bg-red-500/10">
                                {item.sourceWord}
                              </span>
                              <span className="text-xs text-muted-foreground">→</span>
                            </>
                          )}
                          <span className="font-mono text-sm font-semibold text-foreground px-2 py-0.5 rounded bg-muted">
                            {item.word}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border',
                              meta.badgeClass
                            )}
                          >
                            <CategoryIcon className="w-2.5 h-2.5" />
                            <span>{meta.label}</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDismiss(item.word)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                          title="Dismiss suggestion"
                          aria-label={`Dismiss ${item.word}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.reason}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                          ×{item.occurrences} in docs
                        </span>
                        {item.sampleContext && (
                          <span className="truncate max-w-full italic opacity-80" title={item.sampleContext}>
                            &ldquo;{item.sampleContext}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-border/50">
                      {isCorrection && (
                        <button
                          type="button"
                          disabled={wasReplaced}
                          onClick={() => handleFixMisspellingInDocs(item.sourceWord, item.word)}
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                            wasReplaced
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                          )}
                        >
                          {wasReplaced ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Fixed in Docs</span>
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3 h-3" />
                              <span>Fix &ldquo;{item.sourceWord}&rdquo; in Docs</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isAlreadyAdded}
                        onClick={() => handleAddSingle(item.word)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                          isAlreadyAdded
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        )}
                      >
                        {isAlreadyAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>In Dictionary</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Dictionary</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
