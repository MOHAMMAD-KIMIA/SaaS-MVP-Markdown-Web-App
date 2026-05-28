import mermaid from 'mermaid';

let isInitialized = false;

export function initializeMermaid() {
  if (!isInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });
    isInitialized = true;
  }
}

export async function renderMermaid(code: string, id: string): Promise<string> {
  try {
    initializeMermaid();
    const { svg } = await mermaid.render(id, code);
    return svg;
  } catch (error) {
    console.error('Mermaid rendering error:', error);
    throw error;
  }
}
