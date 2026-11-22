import { Label } from '../../../app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../app/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '../../../app/components/ui/toggle-group';
import { useSettingsStore } from '../../../stores/settingsStore';

export function PageLayoutSettings() {
  const { page, updatePageSize, updateOrientation } = useSettingsStore();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Page Layout</h3>

      <div className="space-y-2">
        <Label htmlFor="page-size">Page Size</Label>
        <Select value={page.pageSize} onValueChange={updatePageSize}>
          <SelectTrigger id="page-size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A4">A4</SelectItem>
            <SelectItem value="Letter">Letter</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Orientation</Label>
        <ToggleGroup
          type="single"
          value={page.orientation}
          onValueChange={(value) => value && updateOrientation(value as 'portrait' | 'landscape')}
          className="justify-start"
        >
          <ToggleGroupItem value="portrait">Portrait</ToggleGroupItem>
          <ToggleGroupItem value="landscape">Landscape</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
