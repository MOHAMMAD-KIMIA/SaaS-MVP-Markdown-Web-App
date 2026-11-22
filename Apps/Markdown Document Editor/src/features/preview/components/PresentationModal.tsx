import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid,
  Maximize,
  Minimize,
  Moon,
  Presentation,
  StickyNote,
  Sun,
  X,
} from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { parseMarkdownSlides } from '../../../lib/markdown/slides';
import { preprocessMarkdown } from '../../../lib/markdown/parser';
import { detectTextDirection } from '../../../lib/markdown/textDirection';
import { remarkTextDirection } from './remarkTextDirection';
import { CalloutBlock } from './CalloutBlock';
import { parseCalloutFromBlockquote } from '../utils/calloutParser';
import { MermaidBlock } from './MermaidBlock';
import CodeBlock from './CodeBlock';
import { ThemeMode } from '../../../types/common.types';
import { cn } from '../../../lib/utils/cn';
import {
  ASSET_URI_PREFIX,
  extractWidthFromImageTitle,
  useAssetStore,
} from '../../../stores/assetStore';

const REMARK_PLUGINS = [
  remarkGfm,
  remarkBreaks,
  remarkMath,
  remarkDirective,
  remarkTextDirection,
];
const REHYPE_PLUGINS = [rehypeKatex, rehypeRaw];

function markoraUrlTransform(url: string): string {
  if (url.startsWith(ASSET_URI_PREFIX) || url.startsWith('data:image/')) {
    return url;
  }
  return defaultUrlTransform(url);
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function PresentationModal() {
  const isPresentationOpen = useUIStore((s) => s.isPresentationOpen);
  const closePresentation = useUIStore((s) => s.closePresentation);
  const activeDoc = useDocumentStore((s) => s.getActiveDocument());
  const workspaceTheme = useSettingsStore((s) => s.theme);
  const typography = useSettingsStore((s) => s.typography);
  const assets = useAssetStore((s) => s.assets);
  const assetDataUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assets) {
      map.set(a.id, a.dataUrl);
    }
    return map;
  }, [assets]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideTheme, setSlideTheme] = useState<ThemeMode>(workspaceTheme);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const slides = useMemo(
    () => parseMarkdownSlides(activeDoc?.content || ''),
    [activeDoc?.content]
  );

  useEffect(() => {
    if (isPresentationOpen) {
      setSlideTheme(workspaceTheme);
      setCurrentIndex(0);
      setShowGrid(false);
      setElapsedSeconds(0);
    }
  }, [isPresentationOpen, workspaceTheme, activeDoc?.id]);

  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(Math.max(0, slides.length - 1));
    }
  }, [slides.length, currentIndex]);

  useEffect(() => {
    if (!isPresentationOpen) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPresentationOpen]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen may be restricted inside embedded iframes
    }
  };

  useEffect(() => {
    if (!isPresentationOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showGrid) {
          setShowGrid(false);
        } else {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          closePresentation();
        }
        return;
      }

      if (showGrid) return;

      if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowDown' ||
        e.key === 'PageDown' ||
        e.key === ' '
      ) {
        e.preventDefault();
        setCurrentIndex((idx) => Math.min(slides.length - 1, idx + 1));
      } else if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowUp' ||
        e.key === 'PageUp'
      ) {
        e.preventDefault();
        setCurrentIndex((idx) => Math.max(0, idx - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentIndex(slides.length - 1);
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setShowNotes((v) => !v);
      } else if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setShowGrid((v) => !v);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationOpen, slides.length, showGrid, closePresentation]);

  const markdownComponents = useMemo(
    () => ({
      blockquote({ children, ...props }: any) {
        const callout = parseCalloutFromBlockquote(children);
        if (callout.isCallout) {
          return (
            <CalloutBlock
              type={callout.type}
              title={callout.title}
              isFoldable={callout.isFoldable}
              defaultFolded={callout.defaultFolded}
            >
              {callout.cleanedChildren}
            </CalloutBlock>
          );
        }
        return <blockquote {...props}>{children}</blockquote>;
      },
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : undefined;
        const codeString = String(children).replace(/\n$/, '');
        const isInline = !className || !className.includes('language-');

        if (isInline) {
          return (
            <code dir="ltr" className={cn('inline-code force-ltr', className)} {...props}>
              {children}
            </code>
          );
        }
        if (language === 'mermaid') {
          return <MermaidBlock code={codeString} />;
        }
        return <CodeBlock code={codeString} language={language} />;
      },
      pre({ children }: any) {
        return <>{children}</>;
      },
      img({ node: _node, src, alt, title, className, style, ...props }: any) {
        let resolvedSrc = typeof src === 'string' ? src.trim() : '';
        const customWidth = extractWidthFromImageTitle(title);
        if (resolvedSrc.startsWith(ASSET_URI_PREFIX)) {
          const assetId = resolvedSrc.slice(ASSET_URI_PREFIX.length);
          const dataUrl = assetDataUrlMap.get(assetId);
          if (!dataUrl) {
            return (
              <span className="inline-flex items-center rounded border border-dashed border-border px-2 py-1 text-xs text-muted-foreground">
                Missing local image: {alt || assetId}
              </span>
            );
          }
          resolvedSrc = dataUrl;
        }

        if (!resolvedSrc) {
          return (
            <span className="inline-flex items-center rounded border border-dashed border-border px-2 py-1 text-xs text-muted-foreground">
              {alt || 'Image URL required'}
            </span>
          );
        }

        return (
          <img
            src={resolvedSrc}
            alt={alt || ''}
            title={customWidth ? undefined : title}
            referrerPolicy="no-referrer"
            className={cn('rounded-lg max-w-full h-auto', className)}
            style={customWidth ? { ...style, width: `${customWidth}px` } : style}
            {...props}
          />
        );
      },
    }),
    [assetDataUrlMap]
  );

  if (!isPresentationOpen) return null;

  const currentSlide = slides[currentIndex] || slides[0];
  const nextSlide = slides[currentIndex + 1];
  const progressPercent = slides.length > 0 ? ((currentIndex + 1) / slides.length) * 100 : 100;
  const slideDir = detectTextDirection(currentSlide?.bodyMarkdown || '') ?? 'ltr';

  const themeSurfaceClass =
    slideTheme === 'dark'
      ? 'dark bg-slate-950 text-slate-50'
      : slideTheme === 'sepia'
        ? 'sepia bg-[#fffaf0] text-[#231709]'
        : 'light bg-slate-50 text-slate-900';

  const cardSurfaceClass =
    slideTheme === 'dark'
      ? 'bg-slate-900/90 border-slate-800 shadow-2xl'
      : slideTheme === 'sepia'
        ? 'bg-[#fff4e4] border-[#decba8] shadow-xl'
        : 'bg-white border-slate-200 shadow-xl';

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col overflow-hidden transition-colors',
        themeSurfaceClass
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Slide Deck Presentation"
    >
      {/* Top Progress Strip */}
      <div className="h-1 w-full bg-black/10 dark:bg-white/10 shrink-0">
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Top Controls Bar */}
      <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-b border-border/40 shrink-0 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <Presentation className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-sm truncate">
            {activeDoc?.title || 'Untitled Presentation'}
          </span>
          <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[11px] font-semibold tabular-nums shrink-0">
            Slide {currentIndex + 1} / {slides.length}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground font-mono tabular-nums shrink-0">
            <Clock className="h-3 w-3" />
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Theme Matcher Toggle */}
          <div className="hidden sm:flex items-center rounded-lg border border-border/60 p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => setSlideTheme('light')}
              title="Light slide theme"
              className={cn(
                'p-1.5 rounded-md transition-colors',
                slideTheme === 'light'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSlideTheme('sepia')}
              title="Sepia slide theme"
              className={cn(
                'px-2 py-1 rounded-md text-[11px] font-medium transition-colors',
                slideTheme === 'sepia'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Sepia
            </button>
            <button
              type="button"
              onClick={() => setSlideTheme('dark')}
              title="Dark slide theme"
              className={cn(
                'p-1.5 rounded-md transition-colors',
                slideTheme === 'dark'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            title="Toggle Speaker Notes (N)"
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              showNotes
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <StickyNote className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            title="Slide Overview Grid (G)"
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              showGrid
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Grid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Slides</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen (F)"
            className="p-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              closePresentation();
            }}
            title="Exit Presentation (Esc)"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
        {showGrid ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {slides.map((slide, idx) => (
                <button
                  key={slide.index}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowGrid(false);
                  }}
                  className={cn(
                    'text-left rounded-xl border p-4 transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[150px]',
                    cardSurfaceClass,
                    idx === currentIndex && 'ring-2 ring-primary border-primary'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-mono font-semibold text-primary">
                        Slide {idx + 1}
                      </span>
                      {slide.notes && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                          <StickyNote className="h-3 w-3" />
                          Notes
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2">{slide.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {slide.bodyMarkdown.replace(/[#*_`>]/g, '')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-y-auto relative">
            {/* Previous Slide Button */}
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              aria-label="Previous slide"
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/70 backdrop-blur-xs text-foreground shadow-md hover:bg-background disabled:opacity-25 disabled:pointer-events-none transition-all z-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Slide Card */}
            <article
              key={currentIndex}
              dir={slideDir}
              className={cn(
                'w-full max-w-4xl min-h-[58vh] max-h-full overflow-y-auto rounded-2xl border p-8 sm:p-12 md:p-14 flex flex-col justify-center animate-comment-view',
                cardSurfaceClass
              )}
            >
              <div
                className={cn(
                  'markdown-preview-root prose max-w-none',
                  slideTheme === 'dark' && 'prose-invert'
                )}
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: `${Math.max(18, typography.fontSize + 3)}px`,
                  lineHeight: 1.65,
                }}
              >
                <ReactMarkdown
                  remarkPlugins={REMARK_PLUGINS}
                  rehypePlugins={REHYPE_PLUGINS}
                  urlTransform={markoraUrlTransform}
                  components={markdownComponents}
                >
                  {preprocessMarkdown(currentSlide?.bodyMarkdown || '')}
                </ReactMarkdown>
              </div>
            </article>

            {/* Next Slide Button */}
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))}
              disabled={currentIndex >= slides.length - 1}
              aria-label="Next slide"
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/70 backdrop-blur-xs text-foreground shadow-md hover:bg-background disabled:opacity-25 disabled:pointer-events-none transition-all z-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Speaker Notes Drawer */}
        {showNotes && !showGrid && (
          <aside className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border/50 bg-background/70 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between gap-4 shrink-0 max-h-[35vh] lg:max-h-none overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <StickyNote className="h-3.5 w-3.5" />
                  <span>Speaker Notes</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotes(false)}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {currentSlide?.notes ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground/90 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                  <ReactMarkdown
                    remarkPlugins={REMARK_PLUGINS}
                    rehypePlugins={REHYPE_PLUGINS}
                    urlTransform={markoraUrlTransform}
                    components={markdownComponents}
                  >
                    {preprocessMarkdown(currentSlide.notes)}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground leading-relaxed">
                  No speaker notes on this slide. Add notes in Markdown using{' '}
                  <code className="font-mono">???</code> on a new line or{' '}
                  <code className="font-mono">{'<!-- notes: ... -->'}</code>.
                </div>
              )}
            </div>

            {nextSlide && (
              <div className="border-t border-border/50 pt-3 space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Up Next (Slide {nextSlide.index + 1})
                </div>
                <div className="text-xs font-medium text-foreground truncate">
                  {nextSlide.title}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Slide Progress & Controls */}
      <footer className="border-t border-border/40 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/60 hover:bg-muted/60 disabled:opacity-35"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))}
            disabled={currentIndex >= slides.length - 1}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/60 hover:bg-muted/60 disabled:opacity-35"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Clickable Segmented Progress Dots/Bars */}
        <div className="hidden md:flex items-center gap-1.5 flex-1 max-w-md justify-center">
          {slides.map((s, idx) => (
            <button
              key={s.index}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              title={`Go to slide ${idx + 1}: ${s.title}`}
              className={cn(
                'h-1.5 rounded-full transition-all',
                idx === currentIndex
                  ? 'w-7 bg-primary'
                  : idx < currentIndex
                    ? 'w-2.5 bg-primary/45 hover:bg-primary/70'
                    : 'w-2.5 bg-muted-foreground/25 hover:bg-muted-foreground/50'
              )}
            />
          ))}
        </div>

        <div className="text-[11px] text-muted-foreground hidden sm:block">
          ←/→ Navigate • N Notes • G Overview • Esc Exit
        </div>
      </footer>
    </div>
  );
}
