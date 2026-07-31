import { useEffect, useRef, useState } from 'react';
import { renderMermaid } from '../../../lib/markdown/mermaid';
import { generateId } from '../../../lib/utils/ids';
import { Alert, AlertDescription, AlertTitle } from '../../../app/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface MermaidBlockProps {
  code: string;
}

export function MermaidBlock({ code }: MermaidBlockProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const idRef = useRef(`mermaid-${generateId()}`);

  useEffect(() => {
    const render = async () => {
      try {
        setError('');
        const renderedSvg = await renderMermaid(code, idRef.current);
        setSvg(renderedSvg);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        setSvg('');
      }
    };

    render();
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
      className="my-4 flex items-center justify-center rounded-lg border bg-muted p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
