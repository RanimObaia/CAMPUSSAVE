import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Polices intégrées au site (pas de dépendance à Google Fonts)
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '@fontsource-variable/figtree'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Application installable : le service worker n'est actif qu'en production (pas pendant npm run dev)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
