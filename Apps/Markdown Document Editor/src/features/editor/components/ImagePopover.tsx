// src/features/editor/components/ImagePopover.tsx
import React, { useState } from 'react';
import { Image as ImageIcon, Check, Trash2, X } from 'lucide-react';
import { Input } from '../../../app/components/ui/input';
import { Button } from '../../../app/components/ui/button';
import { cn } from '../../../lib/utils/cn';

interface ImagePopoverProps {
  initialAlt: string;
  initialWidth?: number;
  position: { top: number; left: number };
  onApply: (alt: string, width?: number) => void;
  onRemove?: () => void;
  onClose: () => void;
}

const WIDTH_PRESETS: Array<{ label: string; value: number | undefined }> = [
  { label: 'Auto', value: undefined },
  { label: '240px', value: 240 },
  { label: '400px', value: 400 },
  { label: '600px', value: 600 },
  { label: '800px', value: 800 },
];

export function ImagePopover({
  initialAlt,
  initialWidth,
  position,
  onApply,
  onRemove,
  onClose,
}: ImagePopoverProps) {
  const [alt, setAlt] = useState(initialAlt);
  const [width, setWidth] = useState<number | undefined>(initialWidth);

  const commit = (nextAlt: string, nextWidth?: number) => {
    onApply(nextAlt, nextWidth);
  };

  return (
    <div
      style={{
        top: Math.max(12, Math.min(position.top + 28, 420)),
        left: Math.max(16, Math.min(position.left, 480)),
      }}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-40 w-72 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <ImageIcon className="h-3.5 w-3.5 text-primary" />
          <span>Image Options</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Close image options"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Alt Text</label>
        <Input
          value={alt}
          onChange={(e) => {
            setAlt(e.target.value);
            commit(e.target.value, width);
          }}
          placeholder="Describe image..."
          className="h-7 text-xs"
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-muted-foreground">Display Width</span>
          <span className="font-mono tabular-nums text-foreground">
            {width ? `${width}px` : 'Auto'}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {WIDTH_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setWidth(preset.value);
                commit(alt, preset.value);
              }}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium border transition-colors',
                width === preset.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <input
          type="range"
          min={120}
          max={1000}
          step={20}
          value={width ?? 600}
          onChange={(e) => {
            const next = Number(e.target.value);
            setWidth(next);
            commit(alt, next);
          }}
          className="w-full accent-primary h-1.5 cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/60">
        {onRemove ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 gap-1"
            onClick={onRemove}
          >
            <Trash2 className="h-3 w-3" />
            <span>Remove</span>
          </Button>
        ) : (
          <div />
        )}
        <Button type="button" size="sm" className="h-7 px-3 text-xs gap-1" onClick={onClose}>
          <Check className="h-3 w-3" />
          <span>Done</span>
        </Button>
      </div>
    </div>
  );
}
