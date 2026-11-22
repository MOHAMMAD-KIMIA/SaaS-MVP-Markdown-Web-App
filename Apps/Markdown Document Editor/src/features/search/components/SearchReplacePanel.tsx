import { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '../../../app/components/ui/input';
import { Button } from '../../../app/components/ui/button';
import { useUIStore } from '../../../stores/uiStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { cn } from '../../../lib/utils/cn';

export function SearchReplacePanel() {
  const { isSearchPanelOpen, closeSearchPanel } = useUIStore();
  const { getActiveDocument, updateDocumentContent } = useDocumentStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<number[]>([]);

  const activeDoc = getActiveDocument();

  useEffect(() => {
    if (!activeDoc || !searchTerm) {
      setMatches([]);
      setCurrentIndex(0);
      return;
    }

    const content = activeDoc.content.toLowerCase();
    const search = searchTerm.toLowerCase();
    const foundMatches: number[] = [];

    let index = content.indexOf(search);
    while (index !== -1) {
      foundMatches.push(index);
      index = content.indexOf(search, index + 1);
    }

    setMatches(foundMatches);
    setCurrentIndex(foundMatches.length > 0 ? 0 : -1);
  }, [searchTerm, activeDoc?.content]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const { openSearchPanel, closeSearchPanel, isSearchPanelOpen } = useUIStore.getState();
        if (isSearchPanelOpen) {
          closeSearchPanel();
        } else {
          openSearchPanel();
        }
      }
      if (e.key === 'Escape' && isSearchPanelOpen) {
        closeSearchPanel();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isSearchPanelOpen]);

  const handleNext = () => {
    if (matches.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % matches.length);
    }
  };

  const handlePrevious = () => {
    if (matches.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + matches.length) % matches.length);
    }
  };

  const handleReplaceOne = () => {
    if (!activeDoc || matches.length === 0 || currentIndex === -1) return;

    const matchIndex = matches[currentIndex];
    const newContent =
      activeDoc.content.slice(0, matchIndex) +
      replaceTerm +
      activeDoc.content.slice(matchIndex + searchTerm.length);

    updateDocumentContent(activeDoc.id, newContent);
  };

  const handleReplaceAll = () => {
    if (!activeDoc || !searchTerm) return;

    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = activeDoc.content.replace(regex, replaceTerm);

    updateDocumentContent(activeDoc.id, newContent);
  };

  if (!isSearchPanelOpen) return null;

  return (
    <div className="absolute top-16 right-4 z-50 w-96 rounded-lg border bg-background p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Search & Replace</h3>
        <Button size="sm" variant="ghost" onClick={closeSearchPanel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={handlePrevious} disabled={matches.length === 0}>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleNext} disabled={matches.length === 0}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {searchTerm && (
          <div className="text-xs text-muted-foreground">
            {matches.length > 0
              ? `${currentIndex + 1} of ${matches.length} matches`
              : 'No matches found'}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            placeholder="Replace with..."
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            className="flex-1"
          />
          <Button size="sm" onClick={handleReplaceOne} disabled={matches.length === 0}>
            Replace
          </Button>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleReplaceAll}
          disabled={matches.length === 0}
        >
          Replace All
        </Button>
      </div>
    </div>
  );
}
