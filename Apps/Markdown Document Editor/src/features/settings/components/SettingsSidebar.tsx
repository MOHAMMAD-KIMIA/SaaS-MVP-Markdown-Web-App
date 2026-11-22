import { useEffect } from 'react';
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
  const { isSettingsSidebarOpen, toggleSettingsSidebar, closeSettingsSidebar } = useUIStore();

  useEffect(() => {
    if (!isSettingsSidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSettingsSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsSidebarOpen, closeSettingsSidebar]);

  if (!isSettingsSidebarOpen) return null;

  return (
    <>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs z-30 xl:hidden"
        onClick={closeSettingsSidebar}
      />
      <aside
        aria-label="Document Settings"
        className={cn(
          'absolute xl:relative inset-y-0 right-0 z-40 xl:z-auto flex h-full w-80 max-w-full flex-col border-l bg-background overflow-hidden shrink-0 shadow-2xl xl:shadow-lg'
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3 shrink-0 bg-muted/20">
          <h2 className="font-semibold text-sm truncate">Document Settings</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleSettingsSidebar}
            className="h-8 w-8 p-0 shrink-0"
            aria-label="Close Document Settings"
            title="Close Document Settings (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 space-y-6">
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
      </aside>
    </>
  );
}
