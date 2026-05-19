import { useEffect } from 'react';

/**
 * Hook to manage body scroll lock
 * Call with true to lock scroll, false to unlock
 * Automatically cleans up on unmount
 */
export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (lock) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Unlock scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [lock]);
}
