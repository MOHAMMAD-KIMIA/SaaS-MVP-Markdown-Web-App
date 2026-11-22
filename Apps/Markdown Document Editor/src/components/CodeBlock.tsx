import { useState } from 'react';

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    return langMap[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const lines = code.replace(/\n$/, '').split('\n');

  return (
    <div
      className="code-block-wrapper"
      style={{ margin: '1em 0', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}
    >
      <div
        className="code-block-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: '#f4f4f4',
          borderBottom: '1px solid #ddd',
        }}
      >
        <span className="code-block-language" style={{ fontSize: '12px', fontWeight: 'bold' }}>
          {normalizeLanguage(language)}
        </span>
        <button
          className="code-block-copy-btn"
          onClick={handleCopy}
          style={{ cursor: 'pointer', fontSize: '12px' }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div
        className="code-block-body"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          background: '#282c34',
          color: '#abb2bf',
          overflowX: 'auto',
        }}
      >
        <div
          className="code-block-line-numbers"
          style={{
            padding: '10px',
            textAlign: 'right',
            userSelect: 'none',
            color: '#5c6370',
            borderRight: '1px solid #3e4451',
          }}
        >
          {lines.map((_, index) => (
            <div key={index} style={{ fontFamily: 'monospace', lineHeight: '1.5' }}>
              {index + 1}
            </div>
          ))}
        </div>

        <pre className="code-block-content" style={{ margin: 0, padding: '10px', overflowX: 'auto' }}>
          <code style={{ fontFamily: 'monospace', display: 'block', lineHeight: '1.5' }}>
            {lines.map((line, index) => (
              <div key={index} style={{ whiteSpace: 'pre' }}>
                {line || ' '}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

export default CodeBlock;
