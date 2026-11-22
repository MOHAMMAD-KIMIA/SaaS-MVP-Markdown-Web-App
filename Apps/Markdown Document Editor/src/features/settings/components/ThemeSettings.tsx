import { Label } from '../../../app/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '../../../app/components/ui/toggle-group';
import { useSettingsStore } from '../../../stores/settingsStore';
import { Sun, Moon, Sunrise } from 'lucide-react';

export function ThemeSettings() {
  const { theme, updateTheme } = useSettingsStore();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Theme</h3>

      <div className="space-y-2">
        <Label>Color Mode</Label>
        <ToggleGroup
          type="single"
          value={theme}
          onValueChange={(value) => value && updateTheme(value as 'light' | 'dark' | 'sepia')}
          className="justify-start"
        >
          <ToggleGroupItem value="light">
            <Sun className="mr-2 h-4 w-4" />
            Light
          </ToggleGroupItem>
          <ToggleGroupItem value="dark">
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </ToggleGroupItem>
          <ToggleGroupItem value="sepia">
            <Sunrise className="mr-2 h-4 w-4" />
            Sepia
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
