import React from 'react';
import { Save } from 'lucide-react';
import { Label } from '../../../app/components/ui/label';
import { Switch } from '../../../app/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../app/components/ui/select';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { AutoSaveInterval } from '../../../types/common.types';
import { desktop } from '../../../lib/desktop/bridge';

const intervals: { value: AutoSaveInterval; label: string }[] = [
  { value: 'keystroke', label: 'On every keystroke (Instant)' },
  { value: 5, label: 'Every 5 seconds' },
  { value: 10, label: 'Every 10 seconds' },
  { value: 30, label: 'Every 30 seconds (Default)' },
  { value: 60, label: 'Every 1 minute' },
  { value: 120, label: 'Every 2 minutes' },
  { value: 300, label: 'Every 5 minutes' },
  { value: 600, label: 'Every 10 minutes' },
];

export function AutoSaveSettings() {
  const { autoSave, updateAutoSave } = useSettingsStore();
  const saveToStorage = useDocumentStore((state) => state.saveToStorage);
  const lastSyncedAt = useDocumentStore((state) => state.lastSyncedAt);

  const handleManualSync = () => {
    saveToStorage(true);
    desktop.showNotification('Synced', 'Editor state synced to browser local storage.');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Save className="h-4 w-4 text-primary" />
          Auto-Save & Storage
        </h3>
        <button
          onClick={handleManualSync}
          className="text-xs text-primary hover:underline font-medium transition-colors"
          title="Manually save current editor state to local storage"
        >
          Sync Now
        </button>
      </div>

      <div className="flex items-center justify-between space-x-2 bg-muted/40 p-3 rounded-lg border">
        <div className="space-y-0.5">
          <Label htmlFor="auto-save-toggle" className="text-sm font-medium cursor-pointer">
            Local Storage Auto-Save
          </Label>
          <p className="text-xs text-muted-foreground">
            Automatically save editor state to prevent data loss
          </p>
        </div>
        <Switch
          id="auto-save-toggle"
          checked={autoSave?.enabled ?? true}
          onCheckedChange={(checked) => updateAutoSave({ enabled: checked })}
        />
      </div>

      {(autoSave?.enabled ?? true) && (
        <div className="space-y-2 pt-1 animate-in fade-in duration-200">
          <Label htmlFor="auto-save-interval" className="text-xs font-medium text-muted-foreground">
            Save Interval / Trigger
          </Label>
          <Select
            value={String(autoSave?.interval ?? 30)}
            onValueChange={(val) => {
              const interval: AutoSaveInterval = val === 'keystroke' ? 'keystroke' : (Number(val) as AutoSaveInterval);
              const selectedOption = intervals.find((i) => String(i.value) === val);
              updateAutoSave({ interval });
              desktop.showNotification('Auto-Save Updated', `Sync mode set to: ${selectedOption?.label || val}`);
            }}
          >
            <SelectTrigger id="auto-save-interval">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              {intervals.map((item) => (
                <SelectItem key={String(item.value)} value={String(item.value)}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {lastSyncedAt && (
        <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
          <span>Last storage sync:</span>
          <span className="font-mono">{lastSyncedAt}</span>
        </div>
      )}
    </div>
  );
}
