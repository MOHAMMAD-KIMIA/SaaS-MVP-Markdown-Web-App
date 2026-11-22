// src/components/desktop/views/DesktopDictionary.tsx
import React, { useMemo, useState } from 'react';
import {
  BookA,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  Check,
  X,
  Download,
  Upload,
  EyeOff,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  BookOpenCheck,
  Cpu,
  FileJson,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react';
import {
  getAllBuiltInWords,
  getTechWords,
  getDictionaryStats,
  isWordInDictionary,
} from '../../../lib/spellcheck/dictionary';
import { useSpellCheckStore } from '../../../stores/spellCheckStore';
import { AppView } from '../../../stores/uiStore';
import { cn } from '../../../lib/utils/cn';
import { desktop } from '../../../lib/desktop/bridge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../app/components/ui/dropdown-menu';
import { SmartSuggestionsPanel } from './SmartSuggestionsPanel';
import { DictionaryAnalytics } from './DictionaryAnalytics';

interface DesktopDictionaryProps {
  onNavigate: (view: AppView) => void;
}

type DictionaryTab = 'all' | 'custom' | 'tech' | 'ignored';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PAGE_SIZE = 120;

export function DesktopDictionary({ onNavigate }: DesktopDictionaryProps) {
  const {
    userDictionary,
    ignoredWords,
    addWord,
    addWordsBulk,
    removeWord,
    clearUserDictionary,
    unignoreWord,
    clearIgnoredWords,
  } = useSpellCheckStore();

  const [activeTab, setActiveTab] = useState<DictionaryTab>('custom');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [newWordInput, setNewWordInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);

  const stats = useMemo(() => getDictionaryStats(), []);
  const allBuiltIn = useMemo(() => getAllBuiltInWords(), []);
  const techWords = useMemo(() => getTechWords(), []);
  const userWordSet = useMemo(() => new Set(userDictionary), [userDictionary]);

  const showToastFeedback = (type: 'success' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 3000);
  };

  // Merged and deduplicated master word list when viewing "all"
  const allCombinedWords = useMemo(() => {
    if (userDictionary.length === 0) return allBuiltIn;
    const merged = new Set<string>(allBuiltIn);
    for (const w of userDictionary) merged.add(w);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [allBuiltIn, userDictionary]);

  // Filtered word list based on activeTab, selectedLetter, and searchQuery
  const filteredWords = useMemo(() => {
    let source: string[];
    if (activeTab === 'custom') {
      source = userDictionary;
    } else if (activeTab === 'tech') {
      source = techWords;
    } else if (activeTab === 'ignored') {
      source = ignoredWords;
    } else {
      source = allCombinedWords;
    }

    const q = searchQuery.trim().toLowerCase();
    const letter = selectedLetter !== 'ALL' ? selectedLetter.toLowerCase() : null;

    if (!q && !letter) return source;

    return source.filter((word) => {
      if (letter && !word.startsWith(letter)) return false;
      if (q && !word.includes(q)) return false;
      return true;
    });
  }, [activeTab, userDictionary, techWords, ignoredWords, allCombinedWords, searchQuery, selectedLetter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredWords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedWords = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredWords.slice(start, start + PAGE_SIZE);
  }, [filteredWords, safePage]);

  const handleTabChange = (tab: DictionaryTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleLetterChange = (letter: string) => {
    setSelectedLetter(letter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleAddSingleWord = (e?: React.FormEvent) => {
    e?.preventDefault();
    const raw = newWordInput.trim();
    if (!raw) return;

    // If user typed multiple words separated by spaces/commas, support that automatically
    const tokens = raw
      .split(/[\s,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length > 1) {
      const added = addWordsBulk(tokens);
      setNewWordInput('');
      if (added > 0) {
        showToastFeedback('success', `Added ${added} new word${added === 1 ? '' : 's'} to your custom dictionary.`);
      } else {
        showToastFeedback('info', 'All entered words are already in your custom dictionary.');
      }
      return;
    }

    const single = tokens[0];
    if (!single || single.length < 2) {
      showToastFeedback('info', 'Please enter a valid word with at least 2 letters.');
      return;
    }

    const added = addWord(single);
    setNewWordInput('');
    if (added) {
      showToastFeedback('success', `"${single.toLowerCase()}" added to custom dictionary.`);
    } else {
      showToastFeedback('info', `"${single.toLowerCase()}" is already in your custom dictionary.`);
    }
  };

  const handleAddBulk = () => {
    const tokens = bulkInput
      .split(/[\r\n,;]+|\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;

    const added = addWordsBulk(tokens);
    setBulkInput('');
    setShowBulkAdd(false);
    showToastFeedback(
      added > 0 ? 'success' : 'info',
      added > 0
        ? `Imported ${added} new word${added === 1 ? '' : 's'} into your dictionary.`
        : 'No new words were added (all words were already present).'
    );
  };

  const handleExportCustomDictionary = (format: 'csv' | 'json' | 'txt') => {
    if (userDictionary.length === 0) {
      showToastFeedback('info', 'Your custom dictionary is currently empty.');
      return;
    }

    let content = '';
    let mimeType = 'text/plain;charset=utf-8';
    let fileName = `markora-custom-dictionary.${format}`;

    if (format === 'csv') {
      const escapeCsv = (val: string) =>
        /[",\n\r]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
      content = ['word', ...userDictionary.map(escapeCsv)].join('\n');
      mimeType = 'text/csv;charset=utf-8';
    } else if (format === 'json') {
      content = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          version: 1,
          count: userDictionary.length,
          words: userDictionary,
        },
        null,
        2
      );
      mimeType = 'application/json;charset=utf-8';
    } else {
      content = userDictionary.join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToastFeedback(
      'success',
      `Exported ${userDictionary.length} custom word${userDictionary.length === 1 ? '' : 's'} as .${format.toUpperCase()}.`
    );
    desktop.showNotification(
      'Dictionary Exported',
      `Exported ${userDictionary.length} custom words to ${fileName}.`
    );
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      let tokens: string[] = [];

      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.json')) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            tokens = parsed.map((item) => String(item).trim()).filter(Boolean);
          } else if (parsed && Array.isArray(parsed.words)) {
            tokens = parsed.words.map((item: unknown) => String(item).trim()).filter(Boolean);
          }
        } catch {
          showToastFeedback('info', `Could not parse JSON file "${file.name}".`);
          return;
        }
      } else if (lowerName.endsWith('.csv')) {
        const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        tokens = lines
          .flatMap((line, idx) => {
            const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            if (idx === 0 && cells.length === 1 && cells[0].toLowerCase() === 'word') {
              return [];
            }
            return cells;
          })
          .filter(Boolean);
      } else {
        tokens = text
          .split(/[\r\n,;]+|\s+/)
          .map((t) => t.trim())
          .filter(Boolean);
      }

      const added = addWordsBulk(tokens);
      showToastFeedback(
        added > 0 ? 'success' : 'info',
        `Imported ${added} new word${added === 1 ? '' : 's'} from ${file.name}.`
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const queryValidToken = /^[a-zA-Z][a-zA-Z']*$/.test(trimmedQuery) && trimmedQuery.length >= 2;
  const isQueryKnown =
    queryValidToken && isWordInDictionary(trimmedQuery, userWordSet, new Set(ignoredWords));

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground">
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="border-b border-border pb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('editor')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 -ml-2 rounded-md hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Editor</span>
              </button>
              <span className="text-border">•</span>
              <span className="inline-flex items-center gap-1.5 text-primary text-xs font-semibold uppercase tracking-wider">
                <BookA className="w-3.5 h-3.5" />
                <span>Spell Checker Dictionary</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Markora Dictionary
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your personal custom words added from right-click or below, and browse all {(stats.totalBuiltIn + userDictionary.length).toLocaleString()} recognized words.
            </p>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-center">
              <div className="text-lg font-bold text-foreground tabular-nums">
                {(stats.totalBuiltIn + userDictionary.length).toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground">Total Words</div>
            </div>
            <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-center">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {userDictionary.length.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground">Custom Added</div>
            </div>
            <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-center">
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {stats.techCount.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground">Tech & Markdown</div>
            </div>
          </div>
        </div>

        {/* Quick Add Word Card */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Add Word to Custom Dictionary</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Words added here (or via right-click in the editor) won&apos;t be underlined as spelling errors.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBulkAdd((v) => !v)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{showBulkAdd ? 'Hide Bulk Add' : 'Bulk Add'}</span>
              </button>
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".txt,.csv,.json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Export Backup</span>
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="w-48">
                  <DropdownMenuItem
                    onSelect={() => handleExportCustomDictionary('csv')}
                    className="text-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Export as .CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleExportCustomDictionary('json')}
                    className="text-xs cursor-pointer"
                  >
                    <FileJson className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Export as .JSON</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleExportCustomDictionary('txt')}
                    className="text-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Export as .TXT</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <form onSubmit={handleAddSingleWord} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newWordInput}
                onChange={(e) => setNewWordInput(e.target.value)}
                placeholder="Type a word (e.g. markora, kubernetes, or space-separated words)..."
                className="w-full h-10 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              type="submit"
              disabled={!newWordInput.trim()}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Word</span>
            </button>
          </form>

          {showBulkAdd && (
            <div className="pt-2 border-t border-border space-y-2 animate-in fade-in duration-150">
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={3}
                placeholder="Paste multiple words separated by spaces, commas, or new lines..."
                className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkAdd(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddBulk}
                  disabled={!bulkInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  Import Words
                </button>
              </div>
            </div>
          )}

          {feedback && (
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border animate-in fade-in duration-150',
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* AI-Powered Smart Suggestions */}
        <SmartSuggestionsPanel onFeedback={showToastFeedback} />

        {/* Dictionary Analytics (Recharts Bar Chart) */}
        <DictionaryAnalytics
          onSelectWord={(word) => {
            setActiveTab(userWordSet.has(word) ? 'custom' : 'all');
            setSelectedLetter('ALL');
            handleSearchChange(word);
          }}
        />

        {/* Browse & Search Section */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          {/* Tabs + Search Bar */}
          <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 bg-muted/20">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleTabChange('custom')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  activeTab === 'custom'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>My Dictionary</span>
                <span className="opacity-75 tabular-nums">({userDictionary.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('all')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  activeTab === 'all'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <BookOpenCheck className="w-3.5 h-3.5" />
                <span>All Words</span>
                <span className="opacity-75 tabular-nums">
                  ({allCombinedWords.length.toLocaleString()})
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('tech')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  activeTab === 'tech'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Tech & Markdown</span>
                <span className="opacity-75 tabular-nums">({techWords.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('ignored')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  activeTab === 'ignored'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ignored (Session)</span>
                <span className="opacity-75 tabular-nums">({ignoredWords.length})</span>
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={
                  activeTab === 'custom'
                    ? 'Filter your custom dictionary words...'
                    : 'Search dictionary words...'
                }
                aria-label={
                  activeTab === 'custom'
                    ? 'Filter custom dictionary words'
                    : 'Search dictionary words'
                }
                className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* A-Z Alphabet Filter Bar */}
          <div className="px-4 py-2.5 border-b border-border flex items-center gap-1 overflow-x-auto no-scrollbar bg-background/60">
            <button
              type="button"
              onClick={() => handleLetterChange('ALL')}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-semibold transition-colors shrink-0',
                selectedLetter === 'ALL'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              ALL
            </button>
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => handleLetterChange(letter)}
                className={cn(
                  'w-6 h-6 rounded text-[11px] font-semibold transition-colors shrink-0 flex items-center justify-center',
                  selectedLetter === letter
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Live lookup banner if user searched an exact word */}
          {queryValidToken && activeTab === 'all' && (
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between gap-3">
              {isQueryKnown ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>
                    &quot;{trimmedQuery}&quot; is recognized as a valid word in the dictionary.
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    &quot;{trimmedQuery}&quot; is not currently in the dictionary.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      addWord(trimmedQuery);
                      showToastFeedback('success', `"${trimmedQuery}" added to custom dictionary.`);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add &quot;{trimmedQuery}&quot; to Dictionary</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Live lookup banner for My Dictionary when searching a word not yet added */}
          {queryValidToken && activeTab === 'custom' && !userWordSet.has(trimmedQuery) && (
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                &quot;{trimmedQuery}&quot; is not in your custom dictionary yet.
              </span>
              <button
                type="button"
                onClick={() => {
                  addWord(trimmedQuery);
                  showToastFeedback('success', `"${trimmedQuery}" added to custom dictionary.`);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add &quot;{trimmedQuery}&quot; to My Dictionary</span>
              </button>
            </div>
          )}

          {/* Action bar for Custom or Ignored tabs */}
          {activeTab === 'custom' && userDictionary.length > 0 && (
            <div className="px-4 py-2 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Showing {filteredWords.length} of {userDictionary.length} custom word{userDictionary.length === 1 ? '' : 's'}
                {(searchQuery || selectedLetter !== 'ALL') && ' (filtered)'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportCustomDictionary('csv')}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border border-border bg-background hover:bg-muted transition-colors"
                  title="Download custom dictionary as CSV backup"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Export .CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCustomDictionary('json')}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border border-border bg-background hover:bg-muted transition-colors"
                  title="Download custom dictionary as JSON backup"
                >
                  <FileJson className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Export .JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearUserDictionary();
                    showToastFeedback('info', 'Cleared all custom words from your dictionary.');
                  }}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ignored' && ignoredWords.length > 0 && (
            <div className="px-4 py-2 border-b border-border bg-muted/20 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Words ignored during this editing session
              </span>
              <button
                type="button"
                onClick={() => {
                  clearIgnoredWords();
                  showToastFeedback('info', 'Cleared ignored words list.');
                }}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore All</span>
              </button>
            </div>
          )}

          {/* Word Grid */}
          <div className="p-4">
            {pagedWords.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <BookA className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <div className="text-sm font-medium text-foreground">
                  {activeTab === 'custom' && userDictionary.length === 0
                    ? 'No custom words added yet'
                    : activeTab === 'ignored' && ignoredWords.length === 0
                      ? 'No ignored words in this session'
                      : 'No matching words found'}
                </div>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {activeTab === 'custom' && userDictionary.length === 0
                    ? 'Right-click any underlined word in the editor and choose "Add to Dictionary", or type a word above to add it.'
                    : 'Try clearing the search query or selecting another starting letter.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {pagedWords.map((word) => {
                  const isCustom = userWordSet.has(word);
                  const isIgnoredTab = activeTab === 'ignored';
                  return (
                    <div
                      key={word}
                      className={cn(
                        'group flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors',
                        isCustom
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                          : 'border-border/60 bg-background/60 text-foreground hover:border-border hover:bg-muted/40'
                      )}
                    >
                      <span className="truncate font-mono text-[12px]" title={word}>
                        {word}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        {isCustom && !isIgnoredTab && (
                          <>
                            <span className="text-[9px] uppercase tracking-wider font-semibold px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              Custom
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                removeWord(word);
                                showToastFeedback('info', `Removed "${word}" from custom dictionary.`);
                              }}
                              title={`Remove "${word}" from custom dictionary`}
                              className="p-0.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}

                        {isIgnoredTab && (
                          <button
                            type="button"
                            onClick={() => unignoreWord(word)}
                            title={`Stop ignoring "${word}"`}
                            className="p-0.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {filteredWords.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <div>
                Showing{' '}
                <span className="font-medium text-foreground">
                  {((safePage - 1) * PAGE_SIZE + 1).toLocaleString()}
                </span>
                {' – '}
                <span className="font-medium text-foreground">
                  {Math.min(safePage * PAGE_SIZE, filteredWords.length).toLocaleString()}
                </span>{' '}
                of{' '}
                <span className="font-medium text-foreground">
                  {filteredWords.length.toLocaleString()}
                </span>{' '}
                words
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2 py-1 rounded border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                >
                  First
                </button>
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <span className="px-2 font-mono text-foreground">
                  Page {safePage.toLocaleString()} / {totalPages.toLocaleString()}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2 py-1 rounded border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
