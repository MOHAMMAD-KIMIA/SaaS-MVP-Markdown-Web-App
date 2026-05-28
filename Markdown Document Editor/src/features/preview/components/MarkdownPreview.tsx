// src/features/preview/components/MarkdownPreview.tsx

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
// NOTE: rehype-sanitize will strip KaTeX markup unless heavily configured,
// so we omit it to keep math rendering intact.
// import rehypeSanitize from 'rehype-sanitize';

import 'katex/dist/katex.min.css';
import '../../../styles/MarkdownPreview.css';

import { preprocessMarkdown } from '../../../lib/markdown/parser';
import { MermaidBlock } from './MermaidBlock';
import CodeBlock from './CodeBlock';
import { ScrollArea } from '../../../app/components/ui/scroll-area';
import { cn } from '../../../lib/utils/cn';
import { remarkTextDirection } from './remarkTextDirection';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const processedContent = preprocessMarkdown(content);

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="prose prose-slate dark:prose-invert max-w-none p-8">
        <ReactMarkdown
          remarkPlugins={[
            remarkGfm,
            remarkMath,
            remarkDirective,
            remarkTextDirection,
          ]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : undefined;
              const codeString = String(children).replace(/\n$/, '');
              const isInline = !className || !className.includes('language-');

              if (isInline) {
                return (
                  <code className="inline-code" {...props}>
                    {children}
                  </code>
                );
              }

              if (language === 'mermaid') {
                return <MermaidBlock code={codeString} />;
              }

              return <CodeBlock code={codeString} language={language} />;
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
