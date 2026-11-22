import mermaid from 'mermaid';

let isInitialized = false;

export function initializeMermaid() {
  if (!isInitialized) {
    try {
      const mermaidObj = (mermaid as any).default || mermaid;
      mermaidObj.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit',
        flowchart: {
          htmlLabels: true,
          useMaxWidth: true,
        },
        suppressErrorRendering: true,
      });
      isInitialized = true;
    } catch (e) {
      console.error('Failed to initialize Mermaid:', e);
    }
  }
}

export function sanitizeMermaidCode(code: string): string {
  if (!code) return '';
  return code
    .replace(
      /\[([^\]\r\n]*?)\[+([^\]\r\n]+?)\]+(?:\([^)]*\))?\]/g,
      '["$1 $2"]'
    )
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/"[ \t]+/g, '"')
    .replace(/[ \t]+"/g, '"');
}

export async function renderMermaid(code: string, id: string): Promise<string> {
  const rawCode = code ? code.trim() : '';
  if (!rawCode) {
    return '';
  }

  const cleanCode = sanitizeMermaidCode(rawCode);
  const mermaidObj = (mermaid as any).default || mermaid;
  initializeMermaid();

  // Create a clean alphanumeric ID with no underscores or special characters
  const cleanId = 'mermaid' + Math.random().toString(36).substring(2, 10);

  try {
    if (typeof mermaidObj.parse === 'function') {
      await mermaidObj.parse(cleanCode);
    }
    const result = await mermaidObj.render(cleanId, cleanCode);
    const svg = typeof result === 'string' ? result : result?.svg || '';
    return svg;
  } catch (error) {
    console.warn('Mermaid syntax issue:', error);
    throw error;
  } finally {
    try {
      if (cleanId) {
        const lingering =
          document.getElementById(`d${cleanId}`) ||
          document.getElementById(cleanId);
        if (lingering && lingering.parentNode) {
          lingering.parentNode.removeChild(lingering);
        }
      }
    } catch (e) {
      // ignore cleanup errors
    }
  }
}


