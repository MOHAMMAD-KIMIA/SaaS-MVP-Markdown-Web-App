import { Label } from '../../../app/components/ui/label';
import { Input } from '../../../app/components/ui/input';
import { useSettingsStore } from '../../../stores/settingsStore';

export function MarginSettings() {
  const { page, updateMargins } = useSettingsStore();

  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    const numValue = parseInt(value) || 0;
    updateMargins({
      ...page.margins,
      [side]: numValue,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Margins (px)</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="margin-top">Top</Label>
          <Input
            id="margin-top"
            type="number"
            value={page.margins.top}
            onChange={(e) => handleMarginChange('top', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="margin-right">Right</Label>
          <Input
            id="margin-right"
            type="number"
            value={page.margins.right}
            onChange={(e) => handleMarginChange('right', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="margin-bottom">Bottom</Label>
          <Input
            id="margin-bottom"
            type="number"
            value={page.margins.bottom}
            onChange={(e) => handleMarginChange('bottom', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="margin-left">Left</Label>
          <Input
            id="margin-left"
            type="number"
            value={page.margins.left}
            onChange={(e) => handleMarginChange('left', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
