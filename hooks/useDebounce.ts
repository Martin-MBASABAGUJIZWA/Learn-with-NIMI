// lib/hooks/useDebounce.ts
import { useCallback, useRef } from 'react';

export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Clean up timeout on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Return a memoized debounced version of the callback
  return useCallback((...args: Parameters<T>) => {
    cleanup();
    timeoutRef.current = setTimeout(() => {
      func(...args);
    }, wait);
  }, [func, wait, cleanup]);
}