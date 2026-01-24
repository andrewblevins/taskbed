import { useEffect, useCallback, type RefObject } from 'react';

interface KeyboardShortcutsOptions {
  onNewTask?: () => void;
  onSearch?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onSelectTask?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(
  options: KeyboardShortcutsOptions,
  searchInputRef?: RefObject<HTMLInputElement | null>
) {
  const {
    onNewTask,
    onSearch,
    onNavigateUp,
    onNavigateDown,
    onSelectTask,
    onEscape,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs (except for escape)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Cmd/Ctrl+K - Focus search (works even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (onSearch) {
          onSearch();
        } else if (searchInputRef?.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
        return;
      }

      // Cmd/Ctrl+N - New task (works even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onNewTask?.();
        return;
      }

      // Escape - Close/blur
      if (e.key === 'Escape') {
        onEscape?.();
        if (isInput) {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      // The following shortcuts only work when not in an input
      if (isInput) return;

      // j - Navigate down
      if (e.key === 'j' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onNavigateDown?.();
        return;
      }

      // k - Navigate up
      if (e.key === 'k' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onNavigateUp?.();
        return;
      }

      // Enter - Select/open task
      if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onSelectTask?.();
        return;
      }

      // / - Focus search (vim-style)
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (onSearch) {
          onSearch();
        } else if (searchInputRef?.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
        return;
      }
    },
    [enabled, onNewTask, onSearch, onNavigateUp, onNavigateDown, onSelectTask, onEscape, searchInputRef]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
