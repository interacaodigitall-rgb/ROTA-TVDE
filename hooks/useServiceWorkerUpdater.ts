import { useState, useEffect } from 'react';

export const useServiceWorkerUpdater = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
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

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
      });
    }
  }, []);

  const updateServiceWorker = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return { isUpdateAvailable, updateServiceWorker };
};
