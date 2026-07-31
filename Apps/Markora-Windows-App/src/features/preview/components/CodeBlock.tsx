import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useSettingsStore } from '../../../stores/settingsStore';
import '../../../styles/CodeBlock.css';

type CodeBlockProps = {
  code: string;
  language?: string;
};

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { theme, editor } = useSettingsStore();
  const syntaxHighlighting = editor?.syntaxHighlighting ?? true;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const normalizeLanguage = (lang?: string): string => {
    if (!lang) return 'Plain Text';

    const langMap: Record<string, string> = {
      js: 'JavaScript',
      ts: 'TypeScript',
      jsx: 'JSX',
      tsx: 'TSX',
      py: 'Python',
      rb: 'Ruby',
      sh: 'Shell',
      bash: 'Bash',
      yml: 'YAML',
      yaml: 'YAML',
      json: 'JSON',
      md: 'Markdown',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      sql: 'SQL',
      go: 'Go',
      rust: 'Rust',
      cpp: 'C++',
      c: 'C',
      java: 'Java',
      php: 'PHP',
      swift: 'Swift',
      kotlin: 'Kotlin',
      dart: 'Dart',
    };

    const lower = lang.toLowerCase();
    return langMap[lower] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const lines = code.replace(/\n$/, '').split('\n');

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-language">{normalizeLanguage(language)}</span>

        <button
          type="button"
          className="code-block-copy-btn"
          onClick={handleCopy}
          aria-label={copied ? 'Copied code' : 'Copy code'}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="code-block-body">
        {syntaxHighlighting ? (
          <SyntaxHighlighter
            language={language?.toLowerCase() || 'text'}
            style={theme === 'dark' ? vscDarkPlus : vs}
            showLineNumbers={true}
            customStyle={{
              margin: 0,
              padding: '16px',
              background: 'transparent',
              fontSize: '13px',
              lineHeight: '1.5',
            }}
            lineNumberStyle={{
              minWidth: '2.5em',
              paddingRight: '1em',
              color: 'var(--muted-foreground)',
              opacity: 0.5,
              userSelect: 'none',
            }}
          >
            {code.replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <pre className="code-block-content">
            <code className="code-block-code">
              {lines.map((line, index) => (
                <div key={index} className="code-block-row">
                  <span className="line-number">{index + 1}</span>
                  <span className="code-line">{line || ' '}</span>
                </div>
              ))}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
}

export default CodeBlock;
