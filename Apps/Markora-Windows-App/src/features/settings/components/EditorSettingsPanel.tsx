import React from 'react';
import { Code, Languages, AlignLeft, AlignRight } from 'lucide-react';
import { Label } from '../../../app/components/ui/label';
import { Switch } from '../../../app/components/ui/switch';
import { useSettingsStore } from '../../../stores/settingsStore';

export function EditorSettingsPanel() {
  const { editor, updateEditorSettings } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium flex items-center gap-1.5 mb-4">
          <Code className="h-4 w-4 text-primary" />
          Editor & Code Blocks
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
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
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
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
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium flex items-center gap-1.5 mb-4">
          <Languages className="h-4 w-4 text-primary" />
          Language & Text Direction
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
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
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">Default Text Direction</Label>
              <p className="text-xs text-muted-foreground">
                Fallback direction for new paragraphs and documents when auto-detection is off or neutral.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/40">
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
