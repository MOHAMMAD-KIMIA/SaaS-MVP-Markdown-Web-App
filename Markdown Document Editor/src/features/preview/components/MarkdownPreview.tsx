import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

function getNodeText(node: any): string {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (!node.children || !Array.isArray(node.children)) return '';
  return node.children.map(getNodeText).join('');
}

function withAutoDirection(
  Tag: React.ElementType,
  fallback: 'rtl' | 'ltr' = 'rtl'
) {
  return function DirectedComponent(props: any) {
    const { node, children, className, ...rest } = props;
    const text = getNodeText(node);
    const dir = detectTextDirection(text) ?? fallback;

    return React.createElement(
      Tag,
      {
        ...rest,
        dir,
        className: cn(`auto-dir auto-dir-${dir}`, className),
      },
      children
    );
  };
}

/**
 * Supports custom Markdown direction blocks:
 *
 * :::rtl
 * ## Heading
 * - item
 * :::
 *
 * :::ltr
 * English text
 * :::
 *
 * Also supports inline/text directives if you use them:
 *
 * :rtl[متن فارسی]
 * :ltr[English text]
 */
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

export function MarkdownPreview({
  content,
  className,
}: MarkdownPreviewProps) {
  const processedContent = preprocessMarkdown(content);

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="prose prose-slate dark:prose-invert max-w-none p-8 markdown-preview-root">
        <ReactMarkdown
          remarkPlugins={[
            remarkGfm,
            remarkMath,
            remarkDirective,
            remarkDirectionDirective,
            remarkTextDirection,
          ]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{
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
              const dir = detectTextDirection(text) ?? 'rtl';

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
              const dir = detectTextDirection(text) ?? 'rtl';

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

            code({ className, children, ...props }) {
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

            pre({ children, className, ...props }: any) {
              return (
                <pre
                  dir="ltr"
                  className={cn('force-ltr', className)}
                  {...props}
                >
                  {children}
                </pre>
              );
            },

            a({ children, href, ...props }) {
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

            input({ type, checked, ...props }) {
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
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </ScrollArea>
  );
}