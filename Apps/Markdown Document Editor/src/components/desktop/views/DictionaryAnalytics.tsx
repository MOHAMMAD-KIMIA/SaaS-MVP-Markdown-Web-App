// src/components/desktop/views/DictionaryAnalytics.tsx
import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, Cpu, Plus, FileText, Hash, TrendingUp } from 'lucide-react';
import { useDocumentStore } from '../../../stores/documentStore';
import { useSpellCheckStore } from '../../../stores/spellCheckStore';
import { getTechWords } from '../../../lib/spellcheck/dictionary';
import { cn } from '../../../lib/utils/cn';

interface DictionaryAnalyticsProps {
  onSelectWord?: (word: string) => void;
}

type AnalyticsFilter = 'all' | 'tech' | 'custom';

interface TermFrequencyDatum {
  word: string;
  count: number;
  docCount: number;
  kind: 'custom' | 'tech';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TermFrequencyDatum;
  }>;
}

function AnalyticsTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg space-y-1">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono font-semibold text-sm text-foreground">{item.word}</span>
        <span
          className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded border',
            item.kind === 'custom'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
          )}
        >
          {item.kind === 'custom' ? 'Custom Word' : 'Technical Jargon'}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Total occurrences:</span>
        <span className="font-mono font-semibold text-foreground">{item.count}×</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Appears in:</span>
        <span className="font-mono font-semibold text-foreground">
          {item.docCount} {item.docCount === 1 ? 'document' : 'documents'}
        </span>
      </div>
    </div>
  );
}

export function DictionaryAnalytics({ onSelectWord }: DictionaryAnalyticsProps) {
  const documents = useDocumentStore((s) => s.documents);
  const userDictionary = useSpellCheckStore((s) => s.userDictionary);
  const techWords = useMemo(() => getTechWords(), []);
  const [filter, setFilter] = useState<AnalyticsFilter>('all');

  const analytics = useMemo(() => {
    const userSet = new Set(userDictionary.map((w) => w.toLowerCase()));
    const techSet = new Set(techWords.map((w) => w.toLowerCase()));

    const counts = new Map<string, { count: number; docs: Set<string>; kind: 'custom' | 'tech' }>();
    const wordRegex = /\b[a-zA-Z]+(?:'[a-zA-Z]+)?\b/g;

    for (const doc of documents) {
      const content = doc.content || '';
      if (!content) continue;

      let match: RegExpExecArray | null;
      wordRegex.lastIndex = 0;

      while ((match = wordRegex.exec(content)) !== null) {
        const lower = match[0].toLowerCase();
        const isCustom = userSet.has(lower);
        const isTech = techSet.has(lower);
        if (!isCustom && !isTech) continue;

        const kind: 'custom' | 'tech' = isCustom ? 'custom' : 'tech';
        const entry = counts.get(lower);
        if (entry) {
          entry.count += 1;
          entry.docs.add(doc.id);
        } else {
          counts.set(lower, {
            count: 1,
            docs: new Set([doc.id]),
            kind,
          });
        }
      }
    }

    const allTerms: TermFrequencyDatum[] = Array.from(counts.entries())
      .map(([word, info]) => ({
        word,
        count: info.count,
        docCount: info.docs.size,
        kind: info.kind,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (a.kind !== b.kind) return a.kind === 'custom' ? -1 : 1;
        return a.word.localeCompare(b.word);
      });

    const techTerms = allTerms.filter((t) => t.kind === 'tech');
    const customTerms = allTerms.filter((t) => t.kind === 'custom');

    const totalOccurrences = allTerms.reduce((acc, item) => acc + item.count, 0);

    return {
      allTerms,
      techTerms,
      customTerms,
      totalOccurrences,
      topTerm: allTerms[0] || null,
    };
  }, [documents, userDictionary, techWords]);

  const chartData = useMemo(() => {
    const source =
      filter === 'tech'
        ? analytics.techTerms
        : filter === 'custom'
          ? analytics.customTerms
          : analytics.allTerms;
    return source.slice(0, 12);
  }, [analytics, filter]);

  return (
    <section
      aria-label="Dictionary Analytics"
      className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4"
    >
      {/* Header + Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary shrink-0" />
            <h2 className="text-sm font-semibold text-foreground">Dictionary Analytics</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              Across {documents.length} {documents.length === 1 ? 'document' : 'documents'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Frequency breakdown of the most commonly used technical jargon and custom dictionary words across your workspace.
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              filter === 'all'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>All Terms</span>
            <span className="font-mono text-[10px] opacity-80">({analytics.allTerms.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('tech')}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              filter === 'tech'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Cpu className="w-3 h-3" />
            <span>Technical Jargon</span>
            <span className="font-mono text-[10px] opacity-80">({analytics.techTerms.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('custom')}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              filter === 'custom'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Plus className="w-3 h-3" />
            <span>Custom Words</span>
            <span className="font-mono text-[10px] opacity-80">({analytics.customTerms.length})</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Total Uses</span>
            <Hash className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-base font-bold text-foreground tabular-nums mt-0.5">
            {analytics.totalOccurrences.toLocaleString()}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Tech Terms Used</span>
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5">
            {analytics.techTerms.length}{' '}
            <span className="text-[11px] font-normal text-muted-foreground">/ {techWords.length}</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Custom Words Used</span>
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
            {analytics.customTerms.length}{' '}
            <span className="text-[11px] font-normal text-muted-foreground">
              / {userDictionary.length}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Top Term</span>
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-sm font-bold text-foreground truncate mt-1 font-mono">
            {analytics.topTerm
              ? `${analytics.topTerm.word} (${analytics.topTerm.count}×)`
              : '—'}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      {chartData.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/15 py-10 px-4 text-center space-y-1.5">
          <BarChart3 className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <div className="text-xs font-medium text-foreground">
            {filter === 'custom'
              ? 'None of your custom dictionary words appear in your current documents yet'
              : filter === 'tech'
                ? 'No built-in technical jargon detected in your current documents yet'
                : 'No technical jargon or custom dictionary words detected in your documents yet'}
          </div>
          <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
            {filter === 'custom'
              ? 'Add words you use in your notes to your custom dictionary, or switch to All Terms to view technical jargon frequency.'
              : 'Start writing Markdown or technical notes in the editor to visualize your most frequently used terms.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="h-[270px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 12, left: -12, bottom: 24 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-border/60"
                />
                <XAxis
                  dataKey="word"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-muted-foreground"
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={52}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<AnalyticsTooltip />}
                  cursor={{ fill: 'currentColor', opacity: 0.06 }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                  className={onSelectWord ? 'cursor-pointer' : undefined}
                  onClick={(entry) => {
                    const word = (entry as unknown as TermFrequencyDatum)?.word;
                    if (word && onSelectWord) {
                      onSelectWord(word);
                    }
                  }}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.word}
                      fill={entry.kind === 'custom' ? '#10b981' : '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend & Interactive Hint */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block" />
                <span>Technical Jargon</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                <span>Custom Added Words</span>
              </span>
            </div>
            {onSelectWord && (
              <span>Showing top {chartData.length} terms • Click a bar to search below</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
