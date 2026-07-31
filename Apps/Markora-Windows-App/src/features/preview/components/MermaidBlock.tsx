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

  useEffect(() => {
    if (mermaidSvgCache.has(code)) {
      setSvg(mermaidSvgCache.get(code)!);
      return;
    }

    let isMounted = true;
    const render = async () => {
      try {
        if (isMounted) setError('');
        const uniqueId = `mermaid-${generateId().replace(/[^a-zA-Z0-9]/g, '')}`;
        const renderedSvg = await renderMermaid(code, uniqueId);
        if (isMounted) {
          mermaidSvgCache.set(code, renderedSvg);
          setSvg(renderedSvg);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          setSvg('');
        }
      }
    };

    render();
    return () => {
      isMounted = false;
    };
  }, [code]);

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Mermaid Diagram Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 flex items-center justify-center rounded-lg border bg-muted p-8">
        <p className="text-sm text-muted-foreground">Rendering diagram...</p>
      </div>
    );
  }

  return (
    <div
      className="my-4 flex items-center justify-center rounded-lg border bg-muted p-4 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
