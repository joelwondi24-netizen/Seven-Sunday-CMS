import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          const scriptUrl =
            registration.active?.scriptURL ||
            registration.waiting?.scriptURL ||
            registration.installing?.scriptURL ||
            '';
          if (scriptUrl.includes('dev-sw.js')) {
            registration.unregister().catch(() => {});
          }
        }
      })
      .catch(() => {});
  } else {
    registerSW({ immediate: true });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
