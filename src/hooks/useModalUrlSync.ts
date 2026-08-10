"use client";
import { useEffect } from 'react';

export function useModalUrlSync(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    // Push /modal state when modal opens
    window.history.pushState({ modalOpen: true }, '', '/modal');

    const handlePopState = (event: PopStateEvent) => {
      // Back button pressed while modal was open
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If modal was closed normally (not via back button), restore URL if it was /modal
      if (window.location.pathname === '/modal') {
        window.history.replaceState(null, '', '/');
      }
    };
  }, [isOpen, onClose]);
}
