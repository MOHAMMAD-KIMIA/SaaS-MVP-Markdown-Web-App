import { Label } from '../../../app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../app/components/ui/select';
import { Slider } from '../../../app/components/ui/slider';
import { useSettingsStore } from '../../../stores/settingsStore';

const fontFamilies = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Courier New, monospace', label: 'Courier New' },
];

export function TypographySettings() {
  const { typography, updateFontFamily, updateFontSize, updateLineHeight } = useSettingsStore();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Typography</h3>

      <div className="space-y-2">
        <Label htmlFor="font-family">Font Family</Label>
        <Select value={typography.fontFamily} onValueChange={updateFontFamily}>
          <SelectTrigger id="font-family">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontFamilies.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="font-size">Font Size</Label>
          <span className="text-sm text-muted-foreground">{typography.fontSize}px</span>
        </div>
        <Slider
          id="font-size"
          min={12}
          max={24}
          step={1}
          value={[typography.fontSize]}
          onValueChange={(value) => updateFontSize(value[0])}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="line-height">Line Height</Label>
          <span className="text-sm text-muted-foreground">{typography.lineHeight}</span>
        </div>
        <Slider
          id="line-height"
          min={1.2}
          max={2.4}
          step={0.1}
          value={[typography.lineHeight]}
          onValueChange={(value) => updateLineHeight(value[0])}
        />
      </div>
    </div>
  );
}
