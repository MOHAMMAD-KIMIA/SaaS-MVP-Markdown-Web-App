import { Label } from '../../../app/components/ui/label';
import { Input } from '../../../app/components/ui/input';
import { Switch } from '../../../app/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '../../../app/components/ui/toggle-group';
import { useSettingsStore } from '../../../stores/settingsStore';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export function HeaderFooterSettings() {
  const {
    headerFooter,
    updateHeaderEnabled,
    updateFooterEnabled,
    updateHeaderText,
    updateFooterText,
    updateHeaderAlignment,
    updateFooterAlignment,
  } = useSettingsStore();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Header & Footer</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="header-enabled">Enable Header</Label>
          <Switch
            id="header-enabled"
            checked={headerFooter.headerEnabled}
            onCheckedChange={updateHeaderEnabled}
          />
        </div>

        {headerFooter.headerEnabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="header-text">Header Text</Label>
              <Input
                id="header-text"
                value={headerFooter.headerText}
                onChange={(e) => updateHeaderText(e.target.value)}
                placeholder="Document title"
              />
            </div>

            <div className="space-y-2">
              <Label>Header Alignment</Label>
              <ToggleGroup
                type="single"
                value={headerFooter.headerAlignment}
                onValueChange={(value) =>
                  value && updateHeaderAlignment(value as 'left' | 'center' | 'right')
                }
                className="justify-start"
              >
                <ToggleGroupItem value="left">
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center">
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right">
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="footer-enabled">Enable Footer</Label>
          <Switch
            id="footer-enabled"
            checked={headerFooter.footerEnabled}
            onCheckedChange={updateFooterEnabled}
          />
        </div>

        {headerFooter.footerEnabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="footer-text">Footer Text</Label>
              <Input
                id="footer-text"
                value={headerFooter.footerText}
                onChange={(e) => updateFooterText(e.target.value)}
                placeholder="Page {{page}} of {{total}}"
              />
              <p className="text-xs text-muted-foreground">
                Use {'{{page}}'} and {'{{total}}'} for page numbers
              </p>
            </div>

            <div className="space-y-2">
              <Label>Footer Alignment</Label>
              <ToggleGroup
                type="single"
                value={headerFooter.footerAlignment}
                onValueChange={(value) =>
                  value && updateFooterAlignment(value as 'left' | 'center' | 'right')
                }
                className="justify-start"
              >
                <ToggleGroupItem value="left">
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center">
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right">
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
