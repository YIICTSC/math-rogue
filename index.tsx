import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/styles.css';
import App from './src/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

if (String(import.meta.env.VITE_APP_PLATFORM || '').toLowerCase() === 'ios') {
  document.documentElement.classList.add('app-platform-ios');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
