// src/lib/editor/zenFullscreen.ts
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';

async function safeRequestFullscreen() {
  if (typeof document === 'undefined') return;
  try {
    const el = document.documentElement;
    if (document.fullscreenEnabled && !document.fullscreenElement && el.requestFullscreen) {
      await el.requestFullscreen();
    }
  } catch {
    // Fullscreen may be restricted in embedded iframes; Zen Mode still works full-viewport.
  }
}

async function safeExitFullscreen() {
  if (typeof document === 'undefined') return;
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch {
    // Ignore browser fullscreen exit errors
  }
}

export function enterZenMode() {
  const ui = useUIStore.getState();
  if (ui.currentView !== 'editor') {
    ui.setCurrentView('editor');
  }
  useEditorStore.getState().setZenMode(true);
  void safeRequestFullscreen();
}

export function exitZenMode() {
  useEditorStore.getState().setZenMode(false);
  void safeExitFullscreen();
}

export function toggleZenModeWithFullscreen(): boolean {
  const isZen = useEditorStore.getState().zenMode;
  if (isZen) {
    exitZenMode();
    return false;
  } else {
    enterZenMode();
    return true;
  }
}

export async function toggleNativeFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;
  if (document.fullscreenElement) {
    await safeExitFullscreen();
  } else {
    await safeRequestFullscreen();
  }
}
