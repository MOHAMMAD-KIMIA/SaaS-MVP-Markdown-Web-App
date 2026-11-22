// src/features/editor/components/MermaidBuilderModal.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  RotateCcw,
  Sparkles,
  Workflow,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../app/components/ui/dialog';
import { Button } from '../../../app/components/ui/button';
import { useUIStore } from '../../../stores/uiStore';
import {
  detectMermaidDiagramType,
  MERMAID_TEMPLATES,
  type MermaidThemeOption,
} from '../../../lib/markdown/mermaid';
import { MermaidBlock } from '../../preview/components/MermaidBlock';
import { cn } from '../../../lib/utils/cn';

interface MermaidBuilderModalProps {
  onInsertDiagram: (markdownFence: string) => void;
}

const SNIPPET_CHIPS = [
  { label: '+ Node', text: '\n  N1[New Step]' },
  { label: '+ Decision', text: '\n  D1{Condition?} -- Yes --> Y1[Action]' },
  { label: '+ Database', text: '\n  DB[(Database)]' },
  { label: '+ Subgraph', text: '\n  subgraph Group Title\n    S1[Step A] --> S2[Step B]\n  end' },
  { label: '+ Dashed Arrow', text: ' -.-> ' },
  { label: '+ Thick Arrow', text: ' ==> ' },
];

export function MermaidBuilderModal({ onInsertDiagram }: MermaidBuilderModalProps) {
  const isOpen = useUIStore((s) => s.isMermaidBuilderOpen);
  const closeModal = useUIStore((s) => s.closeMermaidBuilder);

  const [activeTemplateId, setActiveTemplateId] = useState<string>(MERMAID_TEMPLATES[0].id);
  const [code, setCode] = useState<string>(MERMAID_TEMPLATES[0].code);
  const [themeOption, setThemeOption] = useState<MermaidThemeOption>('auto');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Focus code editor slightly after dialog mounts
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const detectedType = useMemo(() => detectMermaidDiagramType(code), [code]);
  const isFlowchart = /^(flowchart|graph)\s+(TD|TB|LR|RL|BT)/im.test(code);

  const handleSelectTemplate = (templateId: string) => {
    const found = MERMAID_TEMPLATES.find((t) => t.id === templateId);
    if (!found) return;
    setActiveTemplateId(found.id);
    setCode(found.code);
  };

  const handleSetFlowDirection = (dir: 'TD' | 'LR' | 'BT' | 'RL') => {
    setCode((prev) =>
      prev.replace(
        /^(\s*(?:flowchart|graph)\s+)(?:TD|TB|LR|RL|BT)/im,
        `$1${dir}`
      )
    );
  };

  const handleInsertSnippet = (snippet: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setCode((prev) => `${prev}${snippet}`);
      return;
    }
    const start = ta.selectionStart ?? code.length;
    const end = ta.selectionEnd ?? code.length;
    const next = code.slice(0, start) + snippet + code.slice(end);
    setCode(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleInsert = () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    const hasInitDirective = trimmed.startsWith('%%{');
    const bodyWithTheme =
      themeOption !== 'auto' && !hasInitDirective
        ? `%%{init: {'theme': '${themeOption}'}}%%\n${trimmed}`
        : trimmed;

    onInsertDiagram(`\`\`\`mermaid\n${bodyWithTheme}\n\`\`\``);
    closeModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-[95vw] w-[1100px] h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 py-3.5 border-b bg-muted/20 shrink-0">
          <DialogTitle className="flex items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
                <Workflow className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">
                  Mermaid Diagram Studio
                </div>
                <div className="text-[11px] font-normal text-muted-foreground">
                  Choose a diagram type, customize syntax, and preview live before inserting
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-400">
              <Sparkles className="h-3 w-3" />
              {detectedType}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Template Strip */}
        <div className="border-b bg-muted/10 px-4 py-2 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {MERMAID_TEMPLATES.map((tpl) => {
              const active = tpl.id === activeTemplateId;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  title={tpl.description}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                    active
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'bg-background border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {tpl.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Split Workspace */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border overflow-hidden">
          {/* Left: Syntax Editor & Quick Builders */}
          <div className="flex flex-col min-h-0 overflow-hidden bg-background">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b bg-muted/15 text-[11px] shrink-0">
              <div className="flex items-center gap-1 flex-wrap">
                {isFlowchart && (
                  <div className="inline-flex items-center gap-0.5 rounded border border-border/70 bg-background p-0.5 mr-1">
                    {(['TD', 'LR', 'BT', 'RL'] as const).map((dir) => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => handleSetFlowDirection(dir)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
                        title={`Set direction ${dir}`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-muted-foreground font-medium mr-1">Snippets:</span>
                {SNIPPET_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleInsertSnippet(chip.text)}
                    className="px-1.5 py-0.5 rounded border border-border/60 bg-background hover:bg-muted text-foreground/85 font-medium transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="mermaid-builder-theme" className="text-muted-foreground">
                  Theme
                </label>
                <select
                  id="mermaid-builder-theme"
                  value={themeOption}
                  onChange={(e) => setThemeOption(e.target.value as MermaidThemeOption)}
                  className="h-6 rounded border border-border bg-background px-1.5 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="auto">Auto</option>
                  <option value="default">Light</option>
                  <option value="dark">Dark</option>
                  <option value="forest">Forest</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  handleInsertSnippet('  ');
                }
              }}
              spellCheck={false}
              placeholder="Write Mermaid diagram syntax here..."
              className="flex-1 w-full resize-none border-0 bg-transparent p-4 font-mono text-xs leading-relaxed text-foreground outline-none"
            />
          </div>

          {/* Right: Live Preview */}
          <div className="flex flex-col min-h-0 overflow-hidden bg-muted/10">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/15 text-[11px] shrink-0">
              <span className="font-semibold text-foreground/80">Live Preview</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                {code.trim() ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Auto-updating</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Empty diagram</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {code.trim() ? (
                <MermaidBlock code={code} themeOverride={themeOption} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  Select a template or enter Mermaid syntax to preview your diagram.
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t bg-muted/20 shrink-0 flex items-center justify-between sm:justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleSelectTemplate(activeTemplateId)}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Template</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleInsert}
              disabled={!code.trim()}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Insert Diagram</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
