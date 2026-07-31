import { useEffect } from 'react';
import { handleShortcutEvent, ShortcutContext } from '../lib/shortcuts/shortcutManager';

export function useKeyboardShortcuts(context?: ShortcutContext) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      const hasMod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      
      // Allow global shortcuts even when typing in input/textarea
      const isGlobalShortcut =
        (hasMod && (key === 's' || key === 'n' || key === 'o' || key === 'e' || key === 'b' || key === '=' || key === '-' || key === '0' || (e.shiftKey && key === 'p') || (e.shiftKey && key === 'f') || (e.altKey && key === 'f'))) ||
        (e.altKey && e.shiftKey && key === 'f') ||
        key === 'f11';

      if (isInput && !isGlobalShortcut) {
        return;
      }

      handleShortcutEvent(e, context);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [context]);
}
