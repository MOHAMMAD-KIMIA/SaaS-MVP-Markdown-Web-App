import React from 'react';
import { Code } from 'lucide-react';
import { Label } from '../../../app/components/ui/label';
import { Switch } from '../../../app/components/ui/switch';
import { useSettingsStore } from '../../../stores/settingsStore';

export function EditorSettingsPanel() {
  const { editor, updateEditorSettings } = useSettingsStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Code className="h-4 w-4 text-primary" />
          Editor & Code Blocks
        </h3>
      </div>

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
  );
}
