
import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Corrected import path for App component
import App from "./src/App";
// Apply saved UI + language settings on boot
try {
  const [{ settingsService, applyUiSettings }, { langService }] = await Promise.all([
    import('./src/services/settingsService'),
    import('./src/services/langService'),
  ]);
  applyUiSettings(settingsService.get());
  langService.load();
} catch {}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
