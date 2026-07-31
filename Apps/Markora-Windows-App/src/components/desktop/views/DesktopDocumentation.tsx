/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Terminal, Code, GitBranch, Table, CheckSquare, Hash, Keyboard, FileText, ArrowRight } from 'lucide-react';
import { useDocumentStore } from '../../../stores/documentStore';

interface DesktopDocumentationProps {
  onNavigate: (view: 'editor' | 'dashboard' | 'publishing' | 'account' | 'documentation') => void;
}

export function DesktopDocumentation({ onNavigate }: DesktopDocumentationProps) {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'syntax' | 'mermaid' | 'math'>('shortcuts');
  const createDocument = useDocumentStore((state) => state.createDocument);

  const handleLoadSample = (title: string, content: string) => {
    const id = createDocument(title);
    useDocumentStore.getState().updateDocumentContent(id, content);
    onNavigate('editor');
  };

  const shortcuts = [
    { key: 'Ctrl + N', desc: 'Create a new blank document in workspace' },
    { key: 'Ctrl + O', desc: 'Open a local Markdown file from Windows disk (.md, .txt)' },
    { key: 'Ctrl + S', desc: 'Save active document to disk or local encrypted storage' },
    { key: 'Ctrl + P', desc: 'Open PDF export print preview dialog' },
    { key: 'Ctrl + K', desc: 'Open command palette for quick action execution' },
    { key: 'Ctrl + F', desc: 'Find and replace text within active editor' },
    { key: 'F11', desc: 'Toggle distraction-free full screen Focus Mode' },
    { key: 'Ctrl + B', desc: 'Toggle bold styling on selected text' },
    { key: 'Ctrl + I', desc: 'Toggle italic styling on selected text' },
    { key: 'Alt + F4', desc: 'Close Markora Desktop window safely' },
  ];

  const sampleMermaid = `graph TD
    A[User Opens Markora] --> B{File Source?}
    B -->|Local Disk| C[Ctrl+O File Dialog]
    B -->|New Doc| D[Ctrl+N Workspace]
    C --> E[Split-pane Editor]
    D --> E
    E --> F[Live Preview & Export HTML/PDF]`;

  const sampleMath = `$$ \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi} $$

The quadratic formula is given by:
$$ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $$`;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 text-foreground select-none animate-in fade-in duration-200">
      <div className="border-b border-border pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Markora Suite v2 Manual</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mt-1">Documentation & Cheat Sheet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reference manual for Windows keyboard accelerators, syntax formatting, and diagram scripting.
          </p>
        </div>

        <div className="flex bg-card p-1 rounded-xl border border-border shrink-0">
          {(['shortcuts', 'syntax', 'mermaid', 'math'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                activeTab === t
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'shortcuts' ? 'Shortcuts' : t === 'syntax' ? 'Markdown' : t === 'mermaid' ? 'Mermaid' : 'LaTeX Math'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'shortcuts' && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center space-x-2">
            <Keyboard className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span>Windows Desktop Keyboard Shortcuts</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shortcuts.map((s, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-card/80 border border-border flex items-center justify-between hover:border-border transition-colors">
                <span className="text-xs text-foreground">{s.desc}</span>
                <kbd className="px-2.5 py-1 rounded bg-background border border-border text-primary font-mono text-xs font-semibold shrink-0 ml-3 shadow-inner">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'syntax' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <Code className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              <span>Standard Markdown & Extensions</span>
            </h2>
            <button
              onClick={() => handleLoadSample('Markdown Cheat Sheet', `# Markora Markdown Guide\n\n## Typography\n**Bold Text**, *Italic Text*, ~~Strikethrough~~\n\n## Tables\n| Header 1 | Header 2 |\n| :--- | :--- |\n| Item A | Value 1 |\n| Item B | Value 2 |\n\n## Task Lists\n- [x] Complete Markora Desktop setup\n- [x] Configure Windows 11 titlebar\n- [ ] Deploy doc to SaaS cloud\n`)}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium border border-indigo-500/30 flex items-center space-x-1 transition-colors"
            >
              <span>Load in Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-card/80 border border-border space-y-3 font-mono">
              <div className="text-muted-foreground font-sans font-semibold">Headings & Formatting</div>
              <div className="text-foreground"># Heading 1</div>
              <div className="text-foreground">## Heading 2</div>
              <div className="text-foreground">**Bold Text** or __Bold__</div>
              <div className="text-foreground">*Italic Text* or _Italic_</div>
              <div className="text-foreground">~~Strikethrough~~</div>
              <div className="text-foreground">&gt; Blockquote quote</div>
            </div>

            <div className="p-5 rounded-2xl bg-card/80 border border-border space-y-3 font-mono">
              <div className="text-muted-foreground font-sans font-semibold">Lists & Links</div>
              <div className="text-foreground">- Bullet item 1</div>
              <div className="text-foreground">- [x] Checked task list item</div>
              <div className="text-foreground">1. Numbered item 1</div>
              <div className="text-foreground">[Link Text](https://markora.cloud)</div>
              <div className="text-foreground">![Image Alt](https://link.to/img.png)</div>
              <div className="text-foreground">[[Internal Wiki Link]]</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mermaid' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Mermaid Diagram Scripting</span>
            </h2>
            <button
              onClick={() => handleLoadSample('Mermaid Architecture Diagram', `\`\`\`mermaid\n${sampleMermaid}\n\`\`\`\n`)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-500/30 flex items-center space-x-1 transition-colors"
            >
              <span>Test Flowchart in Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Wrap your flowchart or sequence diagram code inside standard \`\`\`mermaid fenced blocks. Markora will render them dynamically in the preview pane.
          </p>
          <pre className="p-5 rounded-2xl bg-background border border-border font-mono text-xs text-emerald-700 dark:text-emerald-300 overflow-x-auto">
            {`\`\`\`mermaid\n${sampleMermaid}\n\`\`\``}
          </pre>
        </div>
      )}

      {activeTab === 'math' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>LaTeX Math Formulas (KaTeX)</span>
            </h2>
            <button
              onClick={() => handleLoadSample('LaTeX Formula Practice', `# Mathematical Formulas\n\nHere is an inline formula: $E = mc^2$.\n\nAnd block equations:\n${sampleMath}\n`)}
              className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-medium border border-purple-500/30 flex items-center space-x-1 transition-colors"
            >
              <span>Test Formulas in Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use single \`$\` for inline equations and double \`$$\` for standalone block mathematical equations.
          </p>
          <pre className="p-5 rounded-2xl bg-background border border-border font-mono text-xs text-purple-700 dark:text-purple-300 overflow-x-auto">
            {sampleMath}
          </pre>
        </div>
      )}
    </div>
  );
}
