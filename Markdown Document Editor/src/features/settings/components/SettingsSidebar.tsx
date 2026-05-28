import { X } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { ScrollArea } from '../../../app/components/ui/scroll-area';
import { Separator } from '../../../app/components/ui/separator';
import { useUIStore } from '../../../stores/uiStore';
import { PageLayoutSettings } from './PageLayoutSettings';
import { MarginSettings } from './MarginSettings';
import { HeaderFooterSettings } from './HeaderFooterSettings';
import { TypographySettings } from './TypographySettings';
import { ThemeSettings } from './ThemeSettings';
import { cn } from '../../../lib/utils/cn';

export function SettingsSidebar() {
  const { isSettingsSidebarOpen, toggleSettingsSidebar } = useUIStore();

  if (!isSettingsSidebarOpen) return null;

  return (
    <div className={cn('flex h-full w-80 flex-col border-l bg-background')}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold">Document Settings</h2>
        <Button size="sm" variant="ghost" onClick={toggleSettingsSidebar}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
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
      </ScrollArea>
    </div>
  );
}
