// src/hooks/useKeyboard.ts 

import { useEffect, useState, useCallback } from 'react';

// Types for keyboard shortcuts
interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    callback: () => void;
    description?: string;
}

interface UseKeyboardShortcutsOptions {
    shortcuts: KeyboardShortcut[];
    enabled?: boolean;
    preventDefault?: boolean;
}

// Hook for keyboard shortcuts (Ctrl/Cmd + N, etc.)
export const useKeyboardShortcuts = ({
    shortcuts,
    enabled = true,
    preventDefault = true
}: UseKeyboardShortcutsOptions) => {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const { key, ctrlKey, metaKey, shiftKey, altKey, target } = event;

            // Skip if user is typing in an input field
            const isInputField = (target as HTMLElement)?.tagName?.toLowerCase() === 'input' ||
                (target as HTMLElement)?.tagName?.toLowerCase() === 'textarea' ||
                (target as HTMLElement)?.isContentEditable;

            // Check if any shortcut matches
            const matchedShortcut = shortcuts.find(shortcut => {
                const keyMatch = shortcut.key.toLowerCase() === key.toLowerCase();
                const ctrlMatch = shortcut.ctrl ? (ctrlKey || metaKey) : !ctrlKey && !metaKey;
                const shiftMatch = shortcut.shift ? shiftKey : !shiftKey;
                const altMatch = shortcut.alt ? altKey : !altKey;

                // For single key shortcuts (like "/"), skip if in input field
                if (!shortcut.ctrl && !shortcut.meta && !shortcut.shift && !shortcut.alt && isInputField) {
                    return false;
                }

                return keyMatch && ctrlMatch && shiftMatch && altMatch;
            });

            if (matchedShortcut) {
                if (preventDefault) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                matchedShortcut.callback();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, enabled, preventDefault]);
};

// Types for list navigation
interface UseListNavigationOptions<T> {
    items: T[];
    enabled?: boolean;
    onSelect?: (item: T, index: number) => void;
    onToggleSelect?: (item: T, index: number) => void;
    onSubmit?: () => void;
    onCancel?: () => void;
    getItemId?: (item: T) => string;
    selectedIds?: string[];
    loop?: boolean; 
}

// Hook for list navigation (arrow keys, space, enter)
export const useListNavigation = <T>({
    items,
    enabled = true,
    onSelect,
    onToggleSelect,
    onSubmit,
    onCancel,
    getItemId,
    selectedIds = [],
    loop = true
}: UseListNavigationOptions<T>) => {
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    // Reset focus when items change
    useEffect(() => {
        if (items.length === 0) {
            setFocusedIndex(-1);
        } else if (focusedIndex >= items.length) {
            setFocusedIndex(items.length - 1);
        } else if (focusedIndex === -1 && items.length > 0) {
            setFocusedIndex(0);
        }
    }, [items.length, focusedIndex]);

    const moveFocus = useCallback((direction: 'up' | 'down') => {
        if (items.length === 0) return;

        setFocusedIndex(prevIndex => {
            let newIndex = prevIndex;

            if (direction === 'up') {
                newIndex = prevIndex <= 0 ? (loop ? items.length - 1 : 0) : prevIndex - 1;
            } else {
                newIndex = prevIndex >= items.length - 1 ? (loop ? 0 : items.length - 1) : prevIndex + 1;
            }

            return newIndex;
        });
    }, [items.length, loop]);

    const selectFocused = useCallback(() => {
        if (focusedIndex >= 0 && focusedIndex < items.length) {
            const item = items[focusedIndex];
            onSelect?.(item, focusedIndex);
        }
    }, [focusedIndex, items, onSelect]);

    const toggleSelectFocused = useCallback(() => {
        if (focusedIndex >= 0 && focusedIndex < items.length) {
            const item = items[focusedIndex];
            onToggleSelect?.(item, focusedIndex);
        }
    }, [focusedIndex, items, onToggleSelect]);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    moveFocus('up');
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    moveFocus('down');
                    break;
                case ' ':
                    event.preventDefault();
                    toggleSelectFocused();
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (onSubmit) {
                        onSubmit();
                    } else {
                        selectFocused();
                    }
                    break;
                case 'Escape':
                    event.preventDefault();
                    onCancel?.();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [enabled, moveFocus, selectFocused, toggleSelectFocused, onSubmit, onCancel]);

    // Helper to check if item is focused
    const isItemFocused = useCallback((index: number) => {
        return focusedIndex === index;
    }, [focusedIndex]);

    // Helper to check if item is selected
    const isItemSelected = useCallback((item: T) => {
        if (!getItemId) return false;
        const itemId = getItemId(item);
        return selectedIds.includes(itemId);
    }, [getItemId, selectedIds]);

    return {
        focusedIndex,
        setFocusedIndex,
        isItemFocused,
        isItemSelected,
        moveFocus,
        selectFocused,
        toggleSelectFocused
    };
};

// Utility hook for common shortcuts
export const useCommonShortcuts = () => {
    // Detect if user is on Mac
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    // Create platform-specific modifier key shortcut
    const createShortcut = (key: string, callback: () => void, description?: string): KeyboardShortcut => ({
        key,
        ctrl: !isMac, // Use Ctrl on Windows/Linux
        meta: isMac,  // Use Cmd on Mac
        callback,
        description
    });

    return {
        isMac,
        createShortcut,
        // Common modifier key combinations
        getModifierDisplay: () => isMac ? '⌘' : 'Ctrl',
    };
};

// Hook for modal keyboard handling
export const useModalKeyboard = (onClose?: () => void, onSubmit?: () => void) => {
    const shortcuts: KeyboardShortcut[] = [
        {
            key: 'Escape',
            callback: () => onClose?.(),
            description: 'Close modal'
        }
    ];

    if (onSubmit) {
        shortcuts.push({
            key: 'Enter',
            ctrl: true,
            callback: () => onSubmit(),
            description: 'Submit form'
        });
    }

    useKeyboardShortcuts({ shortcuts });
};

// Hook for form keyboard handling
export const useFormKeyboard = (onSubmit?: () => void, canSubmit: boolean = true) => {
    const shortcuts: KeyboardShortcut[] = [];

    if (onSubmit) {
        shortcuts.push({
            key: 'Enter',
            ctrl: true,
            callback: () => {
                if (canSubmit) {
                    onSubmit();
                }
            },
            description: 'Submit form'
        });
    }

    useKeyboardShortcuts({ shortcuts });
};
