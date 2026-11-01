import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/press-start-2p/400.css';
import './styles.css';
import { App } from './app/App';
import { initStorage } from './app/storage';

// Spielstände zuerst laden (IndexedDB), dann erst anzeigen; ein Fehler darf den Start nie verhindern
void initStorage()
  .catch(() => undefined)
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });

// Offline-Option (PWA): nur im Produktionsbau; Fehler dürfen das Spiel nie stören
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => undefined);
  });
}
