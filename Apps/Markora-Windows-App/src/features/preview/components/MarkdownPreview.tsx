import React from 'react';
import ReactMarkdown from 'react-markdown';
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

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  onScrollProgress?: (progress: number) => void;
}

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

const COMPONENTS_MAP = {
  p: withAutoDirection('p'),
  h1: withAutoDirection('h1'),
  h2: withAutoDirection('h2'),
  h3: withAutoDirection('h3'),
  h4: withAutoDirection('h4'),
  h5: withAutoDirection('h5'),
  h6: withAutoDirection('h6'),
  li: withAutoDirection('li'),
  blockquote: withAutoDirection('blockquote'),

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

  a({ children, href, ...props }: any) {
    const isWikiLink = href?.startsWith('#wiki/');

    return (
      <a
        href={href}
        className={cn(
          isWikiLink && 'text-purple-600 dark:text-purple-400'
        )}
        {...props}
      >
        {children}
      </a>
    );
  },

  input({ type, checked, ...props }: any) {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="mr-2 cursor-pointer"
          {...props}
        />
      );
    }

    return <input type={type} {...props} />;
  },
};

export const MarkdownPreview = React.memo(function MarkdownPreview({
  content,
  className,
  onScrollProgress,
}: MarkdownPreviewProps) {
  const typography = useSettingsStore((state) => state.typography);
  const processedContent = preprocessMarkdown(content);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const maxScroll = target.scrollHeight - target.clientHeight;
    const progress = maxScroll > 0 ? (target.scrollTop / maxScroll) * 100 : 0;
    onScrollProgress?.(Math.min(100, Math.max(0, progress)));
  };

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
        <ReactMarkdown
          remarkPlugins={REMARK_PLUGINS}
          rehypePlugins={REHYPE_PLUGINS}
          components={COMPONENTS_MAP}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
});