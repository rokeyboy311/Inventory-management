import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Register Service Worker for PWA installability & offline support
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => {
        console.log('Performa PWA Service Worker registered:', reg.scope);
      },
      (err) => {
        console.warn('Performa PWA Service Worker registration failed:', err);
      }
    );
  });
}
