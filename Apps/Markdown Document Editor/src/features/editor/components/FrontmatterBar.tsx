// src/features/editor/components/FrontmatterBar.tsx
import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CustomFrontmatterProperty,
  FrontmatterData,
  parseFrontmatter,
  serializeFrontmatter,
} from '../../../lib/markdown/frontmatter';
import { Input } from '../../../app/components/ui/input';
import { Button } from '../../../app/components/ui/button';
import { cn } from '../../../lib/utils/cn';

interface FrontmatterBarProps {
  content: string;
  allWorkspaceTags: string[];
  onUpdateContent: (nextContent: string) => void;
}

const STATUS_OPTIONS = ['', 'Draft', 'In Review', 'Published', 'Archived'];

export function FrontmatterBar({
  content,
  allWorkspaceTags,
  onUpdateContent,
}: FrontmatterBarProps) {
  const parsed = useMemo(() => parseFrontmatter(content), [content]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropVal, setNewPropVal] = useState('');

  const commitMetadata = (patch: Partial<Omit<FrontmatterData, 'hasFrontmatter' | 'body'>>) => {
    const nextData = {
      tags: patch.tags ?? parsed.tags,
      author: patch.author ?? parsed.author,
      status: patch.status ?? parsed.status,
      date: patch.date ?? parsed.date,
      folder: patch.folder ?? parsed.folder,
      customProperties: patch.customProperties ?? parsed.customProperties,
      body: parsed.body,
    };
    onUpdateContent(serializeFrontmatter(nextData));
  };

  const handleAddTag = (rawTag: string) => {
    const cleaned = rawTag.replace(/^#/, '').trim();
    if (!cleaned) return;
    if (!parsed.tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      commitMetadata({ tags: [...parsed.tags, cleaned] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    commitMetadata({ tags: parsed.tags.filter((t) => t !== tagToRemove) });
  };

  const handleAddCustomProp = () => {
    const key = newPropKey.trim();
    if (!key) return;
    const nextProps: CustomFrontmatterProperty[] = [
      ...parsed.customProperties,
      { key, value: newPropVal.trim() },
    ];
    commitMetadata({ customProperties: nextProps });
    setNewPropKey('');
    setNewPropVal('');
  };

  const handleUpdateCustomProp = (idx: number, key: string, value: string) => {
    const next = parsed.customProperties.map((p, i) => (i === idx ? { key, value } : p));
    commitMetadata({ customProperties: next });
  };

  const handleDeleteCustomProp = (idx: number) => {
    commitMetadata({
      customProperties: parsed.customProperties.filter((_, i) => i !== idx),
    });
  };

  const handleRemoveAllFrontmatter = () => {
    onUpdateContent(parsed.body);
    setIsExpanded(false);
  };

  const suggestedTags = useMemo(() => {
    const existingLower = new Set(parsed.tags.map((t) => t.toLowerCase()));
    const q = tagInput.trim().toLowerCase();
    return allWorkspaceTags
      .filter((t) => !existingLower.has(t.toLowerCase()))
      .filter((t) => !q || t.toLowerCase().includes(q))
      .slice(0, 6);
  }, [allWorkspaceTags, parsed.tags, tagInput]);

  const hasAnyMeta =
    parsed.hasFrontmatter ||
    parsed.tags.length > 0 ||
    Boolean(parsed.author || parsed.status || parsed.date || parsed.folder) ||
    parsed.customProperties.length > 0;

  return (
    <div className="border-b border-border bg-muted/20 shrink-0 text-xs">
      {/* Compact Header Row */}
      <div className="flex items-center justify-between gap-2 px-4 py-1.5 min-h-[34px] min-w-0">
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden text-left text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          <SlidersHorizontal className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-medium text-foreground shrink-0">Properties</span>

          {!isExpanded && hasAnyMeta && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0 flex-1 overflow-hidden ml-1">
              {parsed.status && (
                <>
                  <span className="shrink-0 whitespace-nowrap">{parsed.status}</span>
                  <span aria-hidden="true" className="shrink-0">·</span>
                </>
              )}
              {parsed.author && (
                <>
                  <span className="shrink-0 max-w-[120px] truncate">{parsed.author}</span>
                  <span aria-hidden="true" className="shrink-0">·</span>
                </>
              )}
              {parsed.date && (
                <>
                  <span className="tabular-nums shrink-0 whitespace-nowrap">{parsed.date}</span>
                  <span aria-hidden="true" className="shrink-0">·</span>
                </>
              )}
              {parsed.folder && (
                <>
                  <span className="shrink-0 max-w-[120px] truncate">{parsed.folder}</span>
                  <span aria-hidden="true" className="shrink-0">·</span>
                </>
              )}
              {parsed.tags.length > 0 && (
                <span className="text-primary/90 min-w-0 flex-1 truncate">
                  {parsed.tags.map((t) => `#${t}`).join(' · ')}
                </span>
              )}
            </div>
          )}

          {!isExpanded && !hasAnyMeta && (
            <span className="text-[11px] text-muted-foreground/80">
              Add tags, author, status, date, or properties
            </span>
          )}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              <Plus className="h-3 w-3" />
              <span>{hasAnyMeta ? 'Edit' : 'Add Metadata'}</span>
            </button>
          )}
          {isExpanded && hasAnyMeta && (
            <button
              type="button"
              onClick={handleRemoveAllFrontmatter}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear Frontmatter</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Metadata Form */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-2 border-t border-border/60 bg-background/60 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Author</label>
              <Input
                value={parsed.author}
                onChange={(e) => commitMetadata({ author: e.target.value })}
                placeholder="Author name"
                className="h-7 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Status</label>
              <select
                value={parsed.status}
                onChange={(e) => commitMetadata({ status: e.target.value })}
                className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt || 'none'} value={opt}>
                    {opt || '— Select status —'}
                  </option>
                ))}
                {parsed.status && !STATUS_OPTIONS.includes(parsed.status) && (
                  <option value={parsed.status}>{parsed.status}</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-muted-foreground">Date</label>
                <button
                  type="button"
                  onClick={() =>
                    commitMetadata({ date: new Date().toISOString().slice(0, 10) })
                  }
                  className="text-[10px] text-primary hover:underline"
                >
                  Today
                </button>
              </div>
              <Input
                type="date"
                value={/^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : ''}
                onChange={(e) => commitMetadata({ date: e.target.value })}
                className="h-7 text-xs tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Folder / Category
              </label>
              <Input
                value={parsed.folder}
                onChange={(e) => commitMetadata({ folder: e.target.value })}
                placeholder="e.g. Engineering"
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* Tags Editor */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Tags</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {parsed.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-foreground"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  placeholder="Add tag + Enter..."
                  className="h-7 w-36 text-xs"
                />
                {tagInput.trim() && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleAddTag(tagInput)}
                  >
                    Add
                  </Button>
                )}
              </div>
            </div>

            {suggestedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                <span>Workspace tags:</span>
                {suggestedTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleAddTag(t)}
                    className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-muted hover:text-foreground transition-colors"
                  >
                    + #{t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Properties */}
          <div className="space-y-1.5 pt-1 border-t border-border/50">
            <label className="text-[11px] font-medium text-muted-foreground">
              Custom Properties
            </label>

            {parsed.customProperties.map((prop, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={prop.key}
                  onChange={(e) => handleUpdateCustomProp(idx, e.target.value, prop.value)}
                  placeholder="Property key"
                  className="h-7 w-40 text-xs font-mono"
                />
                <Input
                  value={prop.value}
                  onChange={(e) => handleUpdateCustomProp(idx, prop.key, e.target.value)}
                  placeholder="Value"
                  className="h-7 flex-1 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteCustomProp(idx)}
                  aria-label="Delete property"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <Input
                value={newPropKey}
                onChange={(e) => setNewPropKey(e.target.value)}
                placeholder="New property key (e.g. reviewer)"
                className="h-7 w-44 text-xs font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomProp();
                  }
                }}
              />
              <Input
                value={newPropVal}
                onChange={(e) => setNewPropVal(e.target.value)}
                placeholder="Value"
                className="h-7 flex-1 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomProp();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs gap-1 shrink-0"
                onClick={handleAddCustomProp}
                disabled={!newPropKey.trim()}
              >
                <Plus className="h-3 w-3" />
                <span>Add Property</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
