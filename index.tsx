import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/styles.css';
import { registerWebServiceWorker } from './src/services/webAssetCacheService';
import { deferredScreen } from './src/utils/deferredScreen';

// Render a small, usable loading shell before fetching the game and question
// banks. The worker can start protecting downloads on the first visit, too.
const cacheReady = registerWebServiceWorker().then(async registration => {
  if (!registration) return;
  if (!navigator.serviceWorker.controller || registration.installing || registration.waiting) await new Promise<void>(resolve => {
    navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
  });
  navigator.serviceWorker.controller?.postMessage({ type: 'WARM_SHELL' });
}).catch(() => undefined);
const App = deferredScreen(async () => {
  let timer: ReturnType<typeof setTimeout>;
  try {
    // Allow the worker to retry the first game download, but never require
    // offline storage or an installed worker in order to start the game.
    await Promise.race([cacheReady, new Promise(resolve => { timer = setTimeout(resolve, 1800); })]);
  } finally { clearTimeout(timer!); }
  window.dispatchEvent(new Event('learning-rogue-module-ready'));
  return import('./src/App');
}, { startup: true });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const appPlatform = String(import.meta.env.VITE_APP_PLATFORM || '').toLowerCase();
if (appPlatform === 'ios' || appPlatform === 'steam') {
  document.documentElement.classList.add(`app-platform-${appPlatform}`);
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
