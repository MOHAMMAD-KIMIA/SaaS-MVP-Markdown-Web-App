import React from 'react';
import { Code, Languages, AlignLeft, AlignRight, SpellCheck, BookA, AlignVerticalJustifyCenter, Eye } from 'lucide-react';
import { Label } from '../../../app/components/ui/label';
import { Switch } from '../../../app/components/ui/switch';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useEditorStore } from '../../../stores/editorStore';
import { useUIStore } from '../../../stores/uiStore';

export function EditorSettingsPanel() {
  const { editor, updateEditorSettings } = useSettingsStore();
  const focusDimming = useEditorStore((s) => s.focusDimming);
  const typewriterMode = useEditorStore((s) => s.typewriterMode);
  const toggleFocusDimming = useEditorStore((s) => s.toggleFocusDimming);
  const setTypewriterMode = useEditorStore((s) => s.setTypewriterMode);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium flex items-center gap-1.5 mb-4">
          <Code className="h-4 w-4 text-primary" />
          Editor & Code Blocks
        </h3>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <Label htmlFor="syntax-highlighting" className="text-sm font-normal">
                Syntax Highlighting
              </Label>
              <p className="text-xs text-muted-foreground">
                Toggle between developer-focused code styling (colored syntax) and cleaner text styling for code blocks.
              </p>
            </div>
            <Switch
              id="syntax-highlighting"
              checked={editor?.syntaxHighlighting ?? true}
              onCheckedChange={(checked) => updateEditorSettings({ syntaxHighlighting: checked })}
              className="mt-0.5"
            />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <Label htmlFor="format-on-save" className="text-sm font-normal">
                Format on Save
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically format Markdown syntax on save (standardize header spacing, list indentation, and clean up excessive newlines).
              </p>
            </div>
            <Switch
              id="format-on-save"
              checked={editor?.formatOnSave ?? true}
              onCheckedChange={(checked) => updateEditorSettings({ formatOnSave: checked })}
              className="mt-0.5"
            />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <Label htmlFor="spell-check-toggle" className="text-sm font-normal flex items-center gap-1.5">
                <SpellCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Real-time Spell Checker</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Underline misspelled English words and suggest corrections on right-click.
              </p>
            </div>
            <Switch
              id="spell-check-toggle"
              checked={editor?.spellCheck ?? true}
              onCheckedChange={(checked) => updateEditorSettings({ spellCheck: checked })}
              className="mt-0.5"
            />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <Label htmlFor="typewriter-scroll-toggle" className="text-sm font-normal flex items-center gap-1.5">
                <AlignVerticalJustifyCenter className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Typewriter Scrolling</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Keep the active line vertically centered in the editor while typing long documents.
              </p>
            </div>
            <Switch
              id="typewriter-scroll-toggle"
              checked={typewriterMode}
              onCheckedChange={(checked) => setTypewriterMode(checked)}
              className="mt-0.5"
            />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <Label htmlFor="focus-dim-toggle" className="text-sm font-normal flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Focus Mode Paragraph Dimming</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                When Focus Mode is enabled, dim surrounding paragraphs to highlight the active sentence and paragraph.
              </p>
            </div>
            <Switch
              id="focus-dim-toggle"
              checked={focusDimming}
              onCheckedChange={() => toggleFocusDimming()}
              className="mt-0.5"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => useUIStore.getState().openDictionaryPage()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition-colors"
            >
              <BookA className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Open Spell Checker Dictionary</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium flex items-center gap-1.5 mb-4">
          <Languages className="h-4 w-4 text-primary shrink-0" />
          Language & Text Direction
        </h3>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <Label htmlFor="auto-detect-direction" className="text-sm font-normal">
                Auto-Detect Paragraph Language
              </Label>
              <p className="text-xs text-muted-foreground">
                Dynamically detect paragraph language (e.g. Arabic, Hebrew, English) and adjust text direction as you type. Automatically persists paragraph direction on new lines (Enter key).
              </p>
            </div>
            <Switch
              id="auto-detect-direction"
              checked={editor?.autoDetectTextDirection ?? true}
              onCheckedChange={(checked) => updateEditorSettings({ autoDetectTextDirection: checked })}
              className="mt-0.5"
            />
          </div>

          <div className="space-y-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">Default Text Direction</Label>
              <p className="text-xs text-muted-foreground">
                Fallback direction for new paragraphs and documents when auto-detection is off or neutral.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/40">
              <button
                type="button"
                onClick={() => updateEditorSettings({ defaultTextDirection: 'ltr' })}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  (editor?.defaultTextDirection ?? 'ltr') === 'ltr'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <AlignLeft className="h-3.5 w-3.5" />
                LTR
              </button>
              <button
                type="button"
                onClick={() => updateEditorSettings({ defaultTextDirection: 'rtl' })}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  (editor?.defaultTextDirection ?? 'ltr') === 'rtl'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <AlignRight className="h-3.5 w-3.5" />
                RTL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
