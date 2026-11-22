import React from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { visit } from 'unist-util-visit';

import 'katex/dist/katex.min.css';
import '../../../styles/MarkdownPreview.css';

import { preprocessMarkdown } from '../../../lib/markdown/parser';
import { MermaidBlock } from './MermaidBlock';
import CodeBlock from './CodeBlock';
import { ScrollArea } from '../../../app/components/ui/scroll-area';
import { cn } from '../../../lib/utils/cn';
import { remarkTextDirection } from './remarkTextDirection';
import { detectTextDirection } from '../../../lib/markdown/textDirection';
import { useSettingsStore } from '../../../stores/settingsStore';
import { parseFrontmatter } from '../../../lib/markdown/frontmatter';
import {
  ASSET_URI_PREFIX,
  extractWidthFromImageTitle,
  useAssetStore,
} from '../../../stores/assetStore';

function getNodeText(node: any): string {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (!node.children || !Array.isArray(node.children)) return '';
  return node.children.map(getNodeText).join('');
}

function extractTextFromReactNode(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromReactNode).join('');
  if (React.isValidElement(node) && node.props) {
    return extractTextFromReactNode((node.props as any).children);
  }
  return '';
}

function renderParagraphChildren(
  children: React.ReactNode,
  fallbackDir: 'rtl' | 'ltr'
): React.ReactNode {
  const childArray = React.Children.toArray(children);
  if (childArray.length === 0) return children;

  const hasBreaks = childArray.some(
    (child) => React.isValidElement(child) && child.type === 'br'
  );

  if (!hasBreaks) {
    const text = extractTextFromReactNode(children);
    const dir = detectTextDirection(text) ?? fallbackDir;
    return (
      <span
        dir={dir}
        className={cn('block w-full', dir === 'rtl' ? 'text-right' : 'text-left')}
        style={{
          direction: dir,
          textAlign: dir === 'rtl' ? 'right' : 'left',
          unicodeBidi: 'plaintext',
        }}
      >
        {children}
      </span>
    );
  }

  const lineGroups: React.ReactNode[][] = [[]];
  for (const child of childArray) {
    if (React.isValidElement(child) && child.type === 'br') {
      lineGroups.push([]);
    } else {
      lineGroups[lineGroups.length - 1].push(child);
    }
  }

  let currentDir = fallbackDir;
  const renderedLines: React.ReactNode[] = [];

  lineGroups.forEach((groupItems, idx) => {
    const text = extractTextFromReactNode(groupItems);
    const detected = detectTextDirection(text);
    if (detected) {
      currentDir = detected;
    }

    const lineDir = currentDir;

    renderedLines.push(
      <span
        key={`line-${idx}`}
        dir={lineDir}
        className={cn(
          'block w-full',
          lineDir === 'rtl' ? 'text-right' : 'text-left'
        )}
        style={{
          direction: lineDir,
          textAlign: lineDir === 'rtl' ? 'right' : 'left',
          unicodeBidi: 'plaintext',
        }}
      >
        {groupItems.length > 0 ? groupItems : '\u00A0'}
      </span>
    );
  });

  return renderedLines;
}

function withAutoDirection(
  Tag: React.ElementType,
  fallback: 'rtl' | 'ltr' = 'ltr'
) {
  return function DirectedComponent(props: any) {
    const { node, children, className, style, ...rest } = props;
    const text = getNodeText(node);
    const blockDir = detectTextDirection(text) ?? fallback;

    return React.createElement(
      Tag,
      {
        ...rest,
        dir: 'auto',
        className: cn(`auto-dir auto-dir-${blockDir}`, className),
        style: {
          unicodeBidi: 'plaintext',
          textAlign: 'start',
          ...style,
        },
      },
      renderParagraphChildren(children, blockDir)
    );
  };
}

function remarkDirectionDirective() {
  return (tree: any) => {
    visit(tree, (node: any, index?: number, parent?: any) => {
      if (!parent || index === undefined) return;

      if (
        node.type === 'containerDirective' &&
        (node.name === 'rtl' || node.name === 'ltr')
      ) {
        parent.children.splice(
          index,
          1,
          {
            type: 'html',
            value: `<div dir="${node.name}" class="markdown-dir markdown-dir-${node.name}">`,
          },
          ...node.children,
          {
            type: 'html',
            value: '</div>',
          }
        );

        return;
      }

      if (
        (node.type === 'leafDirective' || node.type === 'textDirective') &&
        (node.name === 'rtl' || node.name === 'ltr')
      ) {
        const data = node.data || (node.data = {});
        data.hName = node.type === 'textDirective' ? 'span' : 'div';
        data.hProperties = {
          dir: node.name,
          className: ['markdown-dir', `markdown-dir-${node.name}`],
        };
      }
    });
  };
}

const REMARK_PLUGINS = [
  remarkGfm,
  remarkBreaks,
  remarkMath,
  remarkDirective,
  remarkDirectionDirective,
  remarkTextDirection,
];

const REHYPE_PLUGINS = [rehypeKatex, rehypeRaw];

function markoraUrlTransform(url: string): string {
  if (url.startsWith(ASSET_URI_PREFIX) || url.startsWith('data:image/')) {
    return url;
  }
  return defaultUrlTransform(url);
}

import { CalloutBlock } from './CalloutBlock';
import { parseCalloutFromBlockquote } from '../utils/calloutParser';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  onScrollProgress?: (progress: number) => void;
  onToggleTask?: (taskIndex: number) => void;
  onWikiLinkClick?: (slugOrTitle: string) => void;
}

export const MarkdownPreview = React.memo(function MarkdownPreview({
  content,
  className,
  onScrollProgress,
  onToggleTask,
  onWikiLinkClick,
}: MarkdownPreviewProps) {
  const typography = useSettingsStore((state) => state.typography);
  const assets = useAssetStore((state) => state.assets);
  const frontmatter = React.useMemo(() => parseFrontmatter(content), [content]);
  const processedContent = preprocessMarkdown(frontmatter.body);

  const assetDataUrlMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assets) {
      map.set(a.id, a.dataUrl);
    }
    return map;
  }, [assets]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const maxScroll = target.scrollHeight - target.clientHeight;
    const progress = maxScroll > 0 ? (target.scrollTop / maxScroll) * 100 : 0;
    onScrollProgress?.(Math.min(100, Math.max(0, progress)));
  };

  const taskCounterRef = React.useRef(0);
  taskCounterRef.current = 0;

  const components = React.useMemo(() => {
    return {
      p: withAutoDirection('p'),
      h1: withAutoDirection('h1'),
      h2: withAutoDirection('h2'),
      h3: withAutoDirection('h3'),
      h4: withAutoDirection('h4'),
      h5: withAutoDirection('h5'),
      h6: withAutoDirection('h6'),
      li: withAutoDirection('li'),

      blockquote({ children, node, className, ...props }: any) {
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

        const DirectedBlockquote = withAutoDirection('blockquote');
        return (
          <DirectedBlockquote node={node} className={className} {...props}>
            {children}
          </DirectedBlockquote>
        );
      },

      th({ children, node, className, ...props }: any) {
        const text = getNodeText(node);
        const dir = detectTextDirection(text) ?? 'ltr';

        return (
          <th
            dir={dir}
            className={cn(`auto-dir auto-dir-${dir}`, className)}
            {...props}
          >
            {children}
          </th>
        );
      },

      td({ children, node, className, ...props }: any) {
        const text = getNodeText(node);
        const dir = detectTextDirection(text) ?? 'ltr';

        return (
          <td
            dir={dir}
            className={cn(`auto-dir auto-dir-${dir}`, className)}
            {...props}
          >
            {children}
          </td>
        );
      },

      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : undefined;
        const codeString = String(children).replace(/\n$/, '');
        const isInline = !className || !className.includes('language-');

        if (isInline) {
          return (
            <code
              dir="ltr"
              className={cn('inline-code force-ltr', className)}
              {...props}
            >
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

      a({ children, href, onClick, ...props }: any) {
        const isWikiLink = href?.startsWith('#wiki/');
        const rawTarget = isWikiLink ? decodeURIComponent(href.replace('#wiki/', '')) : '';

        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
          if (isWikiLink) {
            e.preventDefault();
            e.stopPropagation();
            const targetTitle = typeof children === 'string' ? children : rawTarget;
            onWikiLinkClick?.(targetTitle);
          } else if (onClick) {
            onClick(e);
          }
        };

        return (
          <a
            href={href}
            onClick={handleClick}
            className={cn(
              isWikiLink
                ? 'inline-flex items-center gap-0.5 font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 hover:border-purple-300 dark:hover:border-purple-700 transition-colors no-underline cursor-pointer group shadow-2xs'
                : 'text-primary hover:underline'
            )}
            title={isWikiLink ? `Open note: ${children}` : undefined}
            {...props}
          >
            {isWikiLink && (
              <span className="text-purple-500/80 font-mono text-xs select-none">[[</span>
            )}
            {children}
            {isWikiLink && (
              <span className="text-purple-500/80 font-mono text-xs select-none">]]</span>
            )}
          </a>
        );
      },

      input({ type, checked, disabled: _disabled, ...props }: any) {
        if (type === 'checkbox') {
          const currentIndex = taskCounterRef.current++;
          return (
            <input
              type="checkbox"
              checked={Boolean(checked)}
              onChange={(e) => {
                e.stopPropagation();
                onToggleTask?.(currentIndex);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="mr-2 h-4 w-4 cursor-pointer rounded border-border accent-primary align-middle transition-transform hover:scale-110 active:scale-95"
              title="Click to toggle task"
              {...props}
              disabled={false}
            />
          );
        }

        return <input type={type} {...props} />;
      },

      mark({ children, className, ...props }: any) {
        const dataColor = props['data-color'] || props.color;
        const classMatch = className?.match(/markdown-highlight-([a-z]+)/);
        const resolvedColor = dataColor || (classMatch ? classMatch[1] : 'yellow');

        const colorStyles: Record<string, string> = {
          yellow: 'bg-amber-200/95 text-amber-950 dark:bg-amber-400/35 dark:text-amber-100',
          green: 'bg-emerald-200/95 text-emerald-950 dark:bg-emerald-500/30 dark:text-emerald-100',
          blue: 'bg-sky-200/95 text-sky-950 dark:bg-sky-500/30 dark:text-sky-100',
          pink: 'bg-rose-200/95 text-rose-950 dark:bg-rose-500/30 dark:text-rose-100',
          purple: 'bg-purple-200/95 text-purple-950 dark:bg-purple-500/30 dark:text-purple-100',
        };

        const activeColorClass = colorStyles[resolvedColor] || colorStyles.yellow;

        return (
          <mark
            className={cn(
              'markdown-highlight rounded px-1.5 py-0.5 font-medium shadow-2xs',
              `highlight-${resolvedColor}`,
              `markdown-highlight-${resolvedColor}`,
              activeColorClass,
              className
            )}
            {...props}
          >
            {children}
          </mark>
        );
      },

      img({ node: _node, src, alt, title, className, style, ...props }: any) {
        let resolvedSrc = typeof src === 'string' ? src.trim() : '';
        const customWidth = extractWidthFromImageTitle(title);

        if (resolvedSrc.startsWith(ASSET_URI_PREFIX)) {
          const assetId = resolvedSrc.slice(ASSET_URI_PREFIX.length);
          const dataUrl = assetDataUrlMap.get(assetId);
          if (!dataUrl) {
            return (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Missing local asset: {alt || assetId}
              </span>
            );
          }
          resolvedSrc = dataUrl;
        }

        if (!resolvedSrc) {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
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
            className={cn('rounded-lg border border-border/40 max-w-full h-auto', className)}
            style={customWidth ? { ...style, width: `${customWidth}px` } : style}
            {...props}
          />
        );
      },
    };
  }, [onToggleTask, onWikiLinkClick, assetDataUrlMap]);

  const showFrontmatterSummary =
    frontmatter.hasFrontmatter &&
    (frontmatter.tags.length > 0 ||
      Boolean(frontmatter.author || frontmatter.status || frontmatter.date || frontmatter.folder) ||
      frontmatter.customProperties.length > 0);

  return (
    <div className={cn('h-full overflow-y-auto', className)} onScroll={handleScroll}>
      <div
        className="markdown-preview-export-root prose dark:prose-invert max-w-none p-8 markdown-preview-root text-foreground"
        data-export-root="true"
        style={{
          fontFamily: typography.fontFamily,
          fontSize: `${typography.fontSize}px`,
          lineHeight: typography.lineHeight,
        }}
      >
        {showFrontmatterSummary && (
          <div className="not-prose mb-6 pb-3 border-b border-border/60 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
            {frontmatter.status && (
              <span className="font-medium text-foreground">{frontmatter.status}</span>
            )}
            {frontmatter.author && (
              <span>By {frontmatter.author}</span>
            )}
            {frontmatter.date && (
              <span className="tabular-nums">{frontmatter.date}</span>
            )}
            {frontmatter.folder && (
              <span>in {frontmatter.folder}</span>
            )}
            {frontmatter.tags.length > 0 && (
              <span className="text-primary font-medium">
                {frontmatter.tags.map((t) => `#${t}`).join(' · ')}
              </span>
            )}
            {frontmatter.customProperties.map((p, idx) => (
              <span key={`${p.key}-${idx}`}>
                {p.key}: {p.value}
              </span>
            ))}
          </div>
        )}

        <ReactMarkdown
          remarkPlugins={REMARK_PLUGINS}
          rehypePlugins={REHYPE_PLUGINS}
          urlTransform={markoraUrlTransform}
          components={components}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
});