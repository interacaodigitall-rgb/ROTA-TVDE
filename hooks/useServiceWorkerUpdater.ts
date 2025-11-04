import { useState, useEffect } from 'react';

export const useServiceWorkerUpdater = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = () => {
        // Construct the full URL to the service worker to avoid cross-origin issues
        // in certain environments where relative paths might be resolved incorrectly.
        const swUrl = `${location.origin}/sw.js`;
        navigator.serviceWorker.register(swUrl).then(registration => {
          registration.addEventListener('updatefound', () => {
            // A new service worker is being installed.
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  // New worker is installed and waiting to activate.
                  if (navigator.serviceWorker.controller) {
                      setWaitingWorker(newWorker);
                      setIsUpdateAvailable(true);
                  }
                }
              });
            }
          });
        }).catch(error => {
          console.error('Service Worker registration failed:', error);
        });
      };
      
      // Defer registration until after the page has loaded to prevent race conditions.
      window.addEventListener('load', registerServiceWorker);

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
      });
      
      // Cleanup the event listener on component unmount.
      return () => {
        window.removeEventListener('load', registerServiceWorker);
      };
    }
  }, []);

  const updateServiceWorker = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return { isUpdateAvailable, updateServiceWorker };
};
