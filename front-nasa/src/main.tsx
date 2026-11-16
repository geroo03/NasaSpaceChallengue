import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { LangProvider } from './i18n/LangContext.tsx';
import { ProfileProvider } from './profile/ProfileContext.tsx';
import { GuideProvider } from './components/guide/GuideContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <ProfileProvider>
        <GuideProvider>
          <App />
        </GuideProvider>
      </ProfileProvider>
    </LangProvider>
  </StrictMode>,
);

// Installable app that keeps working with poor signal in the field (see public/sw.js).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
