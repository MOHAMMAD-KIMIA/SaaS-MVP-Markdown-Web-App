import { X } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Separator } from '../../../app/components/ui/separator';
import { useUIStore } from '../../../stores/uiStore';
import { PageLayoutSettings } from './PageLayoutSettings';
import { MarginSettings } from './MarginSettings';
import { HeaderFooterSettings } from './HeaderFooterSettings';
import { TypographySettings } from './TypographySettings';
import { ThemeSettings } from './ThemeSettings';
import { AutoSaveSettings } from './AutoSaveSettings';
import { EditorSettingsPanel } from './EditorSettingsPanel';
import { cn } from '../../../lib/utils/cn';

export function SettingsSidebar() {
  const { isSettingsSidebarOpen, toggleSettingsSidebar } = useUIStore();

  if (!isSettingsSidebarOpen) return null;

  return (
    <div className={cn('flex h-full w-80 flex-col border-l bg-background overflow-hidden shrink-0 shadow-lg')}>
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0 bg-muted/20">
        <h2 className="font-semibold text-sm">Document Settings</h2>
        <Button size="sm" variant="ghost" onClick={toggleSettingsSidebar} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AutoSaveSettings />
        <Separator />
        <EditorSettingsPanel />
        <Separator />
        <PageLayoutSettings />
        <Separator />
        <MarginSettings />
        <Separator />
        <HeaderFooterSettings />
        <Separator />
        <TypographySettings />
        <Separator />
        <ThemeSettings />
      </div>
    </div>
  );
}
