import React, { useEffect, useState } from 'react';
import { renderMermaid } from '../../../lib/markdown/mermaid';
import { generateId } from '../../../lib/utils/ids';
import { Alert, AlertDescription, AlertTitle } from '../../../app/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface MermaidBlockProps {
  code: string;
}

const mermaidSvgCache = new Map<string, string>();

export const MermaidBlock = React.memo(function MermaidBlock({ code }: MermaidBlockProps) {
  const [svg, setSvg] = useState<string>(() => mermaidSvgCache.get(code) || '');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(!mermaidSvgCache.has(code));

  useEffect(() => {
    const trimmed = code?.trim() || '';
    if (!trimmed) {
      setSvg('');
      setError('');
      setIsLoading(false);
      return;
    }

    if (mermaidSvgCache.has(code)) {
      setSvg(mermaidSvgCache.get(code)!);
      setError('');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const render = async () => {
      try {
        if (isMounted) setError('');
        const uniqueId = generateId().replace(/[^a-zA-Z0-9]/g, '');
        const renderedSvg = await renderMermaid(code, uniqueId);
        if (isMounted) {
          mermaidSvgCache.set(code, renderedSvg);
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
    };

    const timer = setTimeout(() => {
      render();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [code]);

  if (error) {
    return (
      <Alert variant="destructive" className="my-4 force-ltr" dir="ltr">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Mermaid Diagram Syntax Error</AlertTitle>
        <AlertDescription className="font-mono text-xs whitespace-pre-wrap">{error}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading && !svg) {
    return (
      <div className="my-4 flex items-center justify-center rounded-lg border bg-muted/50 p-6 force-ltr" dir="ltr">
        <p className="text-sm text-muted-foreground animate-pulse">Rendering diagram...</p>
      </div>
    );
  }

  if (!svg) {
    return null;
  }

  return (
    <div
      className="my-4 flex items-center justify-center rounded-lg border bg-card p-4 overflow-x-auto force-ltr"
      dir="ltr"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});

