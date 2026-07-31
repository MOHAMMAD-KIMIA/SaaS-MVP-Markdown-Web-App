import mermaid from 'mermaid';

let isInitialized = false;

export function initializeMermaid() {
  if (!isInitialized) {
    mermaid.initialize({
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
  }
}

export async function renderMermaid(code: string, id: string): Promise<string> {
  let cleanId = '';
  try {
    initializeMermaid();
    cleanId = 'm' + id.replace(/[^a-zA-Z0-9]/g, '') + '_' + Math.random().toString(36).substring(2, 8);
    const { svg } = await mermaid.render(cleanId, code);
    return svg;
  } catch (error) {
    console.error('Mermaid rendering error:', error);
    throw error;
  } finally {
    // Clean up temporary DOM elements created by mermaid if any lingered
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

