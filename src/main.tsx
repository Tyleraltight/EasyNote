import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { Analytics } from '@vercel/analytics/react'

// PWA auto-update and reload mechanism
if ('serviceWorker' in navigator) {
  const checkUpdate = () => {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  };

  // Check for updates when app becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkUpdate();
    }
  });

  // Automatically reload the page when a new service worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)
