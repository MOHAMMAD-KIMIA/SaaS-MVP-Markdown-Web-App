import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Code2,
  Copy,
  Download,
  ImageDown,
  Maximize2,
  Minimize2,
  Palette,
  RotateCcw,
  Workflow,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  detectMermaidDiagramType,
  type MermaidThemeOption,
  renderMermaid,
} from '../../../lib/markdown/mermaid';
import { generateId } from '../../../lib/utils/ids';
import { useSettingsStore } from '../../../stores/settingsStore';
import { copyToClipboard } from '../../../lib/utils/clipboard';
import { desktop } from '../../../lib/desktop/bridge';
import { Alert, AlertDescription, AlertTitle } from '../../../app/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../app/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../app/components/ui/dropdown-menu';
import { cn } from '../../../lib/utils/cn';

interface MermaidBlockProps {
  code: string;
  compact?: boolean;
  themeOverride?: MermaidThemeOption;
}

const MAX_SVG_CACHE = 150;
const mermaidSvgCache = new Map<string, string>();

function cacheSvg(key: string, svg: string) {
  if (mermaidSvgCache.size >= MAX_SVG_CACHE) {
    const firstKey = mermaidSvgCache.keys().next().value;
    if (firstKey !== undefined) {
      mermaidSvgCache.delete(firstKey);
    }
  }
  mermaidSvgCache.set(key, svg);
}

const THEME_LABELS: Record<MermaidThemeOption, string> = {
  auto: 'Auto',
  default: 'Light',
  dark: 'Dark',
  forest: 'Forest',
  neutral: 'Neutral',
};

export const MermaidBlock = React.memo(function MermaidBlock({
  code,
  compact = false,
  themeOverride,
}: MermaidBlockProps) {
  const appTheme = useSettingsStore((s) => s.theme);
  const [selectedTheme, setSelectedTheme] = useState<MermaidThemeOption>(
    themeOverride || 'auto'
  );
  const effectiveThemeOption = themeOverride ?? selectedTheme;
  const resolvedAppTheme = effectiveThemeOption === 'auto' ? appTheme : effectiveThemeOption;
  const cacheKey = `${effectiveThemeOption}:${resolvedAppTheme}:${code}`;

  const [svg, setSvg] = useState<string>(() => mermaidSvgCache.get(cacheKey) || '');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(!mermaidSvgCache.has(cacheKey));

  const [zoom, setZoom] = useState<number>(1);
  const [showSource, setShowSource] = useState<boolean>(false);
  const [copiedMode, setCopiedMode] = useState<'code' | 'svg' | null>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);
  const [modalZoom, setModalZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgContainerRef = useRef<HTMLDivElement | null>(null);

  const diagramType = useMemo(() => detectMermaidDiagramType(code), [code]);

  useEffect(() => {
    const trimmed = code?.trim() || '';
    if (!trimmed) {
      setSvg('');
      setError('');
      setIsLoading(false);
      return;
    }

    const cached = mermaidSvgCache.get(cacheKey);
    if (cached) {
      setSvg(cached);
      setError('');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        if (isMounted) setError('');
        const uniqueId = generateId().replace(/[^a-zA-Z0-9]/g, '');
        const renderedSvg = await renderMermaid(code, uniqueId, {
          theme: effectiveThemeOption,
          appTheme,
        });
        if (isMounted) {
          cacheSvg(cacheKey, renderedSvg);
          setSvg(renderedSvg);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Syntax error in Mermaid diagram');
          setSvg('');
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [code, cacheKey, effectiveThemeOption, appTheme]);

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedMode('code');
      setTimeout(() => setCopiedMode(null), 1800);
    }
  };

  const handleCopySvg = async () => {
    if (!svg) return;
    const ok = await copyToClipboard(svg);
    if (ok) {
      setCopiedMode('svg');
      setTimeout(() => setCopiedMode(null), 1800);
      desktop.showNotification('SVG Copied', 'Copied Mermaid diagram SVG markup.');
    }
  };

  const handleDownloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagramType.toLowerCase().replace(/\s+/g, '-')}-diagram.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = async () => {
    if (!svg) return;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgEl = doc.documentElement;

      let width = 1200;
      let height = 800;
      const renderedSvgEl = svgContainerRef.current?.querySelector('svg');
      if (renderedSvgEl) {
        const rect = renderedSvgEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          width = Math.ceil(rect.width);
          height = Math.ceil(rect.height);
        }
      } else {
        const viewBox = svgEl.getAttribute('viewBox');
        if (viewBox) {
          const parts = viewBox.split(/[\s,]+/).map(Number);
          if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
            width = Math.ceil(parts[2]);
            height = Math.ceil(parts[3]);
          }
        }
      }

      svgEl.setAttribute('width', String(width));
      svgEl.setAttribute('height', String(height));
      if (!svgEl.getAttribute('xmlns')) {
        svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }

      const serialized = new XMLSerializer().serializeToString(svgEl);
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

      const img = new Image();
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = resolvedAppTheme === 'dark' ? '#0f172a' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${diagramType.toLowerCase().replace(/\s+/g, '-')}-diagram.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 'image/png');
      };
      img.src = dataUrl;
    } catch (err) {
      console.error('PNG export failed:', err);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="my-4 force-ltr space-y-2" dir="ltr">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between gap-2">
          <span>Mermaid {diagramType} Syntax Error</span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1 rounded border border-destructive/30 px-2 py-0.5 text-[11px] font-medium hover:bg-destructive/10"
          >
            {copiedMode === 'code' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>{copiedMode === 'code' ? 'Copied' : 'Copy Code'}</span>
          </button>
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <div className="font-mono text-xs whitespace-pre-wrap">{error}</div>
          <pre className="rounded bg-background/80 p-2 text-[11px] font-mono text-foreground/85 overflow-x-auto border border-destructive/20">
            {code}
          </pre>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading && !svg) {
    return (
      <div className="my-4 flex items-center justify-center rounded-lg border bg-muted/50 p-6 force-ltr" dir="ltr">
        <p className="text-sm text-muted-foreground animate-pulse">
          Rendering {diagramType.toLowerCase()}...
        </p>
      </div>
    );
  }

  if (!svg) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          'group/mermaid my-4 rounded-xl border border-border/80 bg-card shadow-2xs overflow-hidden force-ltr',
          compact && 'my-2'
        )}
        dir="ltr"
      >
        {!compact && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground/90">
                <Workflow className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                <span>Mermaid</span>
              </span>
              <span className="rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 text-[10px] font-medium">
                {diagramType}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {!themeOverride && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      title="Switch Mermaid theme"
                      className="inline-flex items-center gap-1 rounded px-1.5 py-1 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Palette className="h-3 w-3" />
                      <span>{THEME_LABELS[selectedTheme]}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32 text-xs">
                    {(['auto', 'default', 'dark', 'forest', 'neutral'] as MermaidThemeOption[]).map(
                      (t) => (
                        <DropdownMenuItem
                          key={t}
                          onSelect={() => setSelectedTheme(t)}
                          className="justify-between text-xs"
                        >
                          <span>{THEME_LABELS[t]}</span>
                          {selectedTheme === t && <Check className="h-3 w-3 text-primary" />}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <div className="inline-flex items-center rounded border border-border/60 bg-background/70">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
                  title="Zoom Out"
                  aria-label="Zoom Out Diagram"
                  className="p-1 hover:bg-muted hover:text-foreground transition-colors rounded-l"
                >
                  <ZoomOut className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  title="Reset Zoom"
                  className="px-1.5 py-0.5 font-mono text-[10px] tabular-nums hover:bg-muted hover:text-foreground transition-colors"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
                  title="Zoom In"
                  aria-label="Zoom In Diagram"
                  className="p-1 hover:bg-muted hover:text-foreground transition-colors rounded-r"
                >
                  <ZoomIn className="h-3 w-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSource((v) => !v)}
                title={showSource ? 'Show Diagram' : 'View Mermaid Source'}
                className={cn(
                  'inline-flex items-center gap-1 rounded px-1.5 py-1 transition-colors',
                  showSource
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'hover:bg-muted hover:text-foreground'
                )}
              >
                <Code2 className="h-3 w-3" />
                <span className="hidden sm:inline">{showSource ? 'Diagram' : 'Source'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy Mermaid Code"
                aria-label="Copy Mermaid Code"
                className="p-1 rounded hover:bg-muted hover:text-foreground transition-colors"
              >
                {copiedMode === 'code' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title="Export Diagram"
                    aria-label="Export Diagram"
                    className="inline-flex items-center gap-1 rounded px-1.5 py-1 hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 text-xs">
                  <DropdownMenuItem onSelect={handleDownloadSvg} className="text-xs">
                    <Download className="mr-2 h-3.5 w-3.5 text-primary" />
                    <span>Download SVG</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleDownloadPng} className="text-xs">
                    <ImageDown className="mr-2 h-3.5 w-3.5 text-indigo-500" />
                    <span>Download PNG</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleCopySvg} className="text-xs">
                    <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span>Copy SVG Code</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => {
                  setModalZoom(1);
                  setPan({ x: 0, y: 0 });
                  setIsFullscreenOpen(true);
                }}
                title="Open Interactive Fullscreen Viewer"
                aria-label="Open Interactive Fullscreen Viewer"
                className="p-1 rounded hover:bg-muted hover:text-foreground transition-colors"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {showSource ? (
          <pre className="m-0 p-4 text-xs font-mono bg-muted/20 text-foreground overflow-x-auto whitespace-pre">
            {code}
          </pre>
        ) : (
          <div className="p-4 overflow-auto flex items-center justify-center">
            <div
              ref={svgContainerRef}
              className="transition-transform duration-150 origin-center"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        )}
      </div>

      {/* Interactive Pan & Zoom Fullscreen Lightbox */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-[94vw] w-[1120px] h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b bg-muted/20 shrink-0 flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <Workflow className="h-4 w-4 text-violet-500" />
              <span>Mermaid {diagramType} Viewer</span>
            </DialogTitle>

            <div className="flex items-center gap-1.5 pr-7 text-xs">
              <button
                type="button"
                onClick={() => setModalZoom((z) => Math.max(0.3, Number((z - 0.2).toFixed(2))))}
                className="p-1.5 rounded border border-border hover:bg-muted"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono text-xs tabular-nums min-w-[3.2rem] text-center">
                {Math.round(modalZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setModalZoom((z) => Math.min(3.5, Number((z + 0.2).toFixed(2))))}
                className="p-1.5 rounded border border-border hover:bg-muted"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded border border-border hover:bg-muted"
                title="Reset View"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPng}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <ImageDown className="h-3.5 w-3.5" />
                <span>PNG</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreenOpen(false)}
                className="p-1.5 rounded border border-border hover:bg-muted"
                title="Exit Fullscreen"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </DialogHeader>

          <div
            className={cn(
              'flex-1 overflow-hidden bg-muted/10 flex items-center justify-center relative select-none',
              isPanning ? 'cursor-grabbing' : 'cursor-grab'
            )}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY < 0 ? 0.12 : -0.12;
              setModalZoom((z) => Math.min(3.5, Math.max(0.3, Number((z + delta).toFixed(2)))));
            }}
            onMouseDown={(e) => {
              setIsPanning(true);
              panOriginRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            }}
            onMouseMove={(e) => {
              if (!isPanning) return;
              setPan({
                x: e.clientX - panOriginRef.current.x,
                y: e.clientY - panOriginRef.current.y,
              });
            }}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
          >
            <div
              className="transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${modalZoom})`,
                transformOrigin: 'center center',
              }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <span className="pointer-events-none absolute bottom-3 right-4 rounded-full bg-background/85 border border-border/70 px-2.5 py-1 text-[10px] text-muted-foreground shadow-xs">
              Drag to pan · Scroll to zoom
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
