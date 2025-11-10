/**
 * Service Worker Registration
 * Registers and manages the service worker lifecycle
 */

export function register(): void {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[SW] Registration successful:', registration.scope);

          // Check for updates periodically
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] New content available, please refresh');

                  // Optionally notify user about update
                  // You can integrate this with your UI state management
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });
    });
  }
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.unregister();
      })
      .then(() => {
        console.log('[SW] Unregistered successfully');
      })
      .catch((error) => {
        console.error('[SW] Unregistration failed:', error);
      });
  }
}

export function skipWaiting(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
  }
}
