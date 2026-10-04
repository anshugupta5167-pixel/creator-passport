import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './app/globals.css';
import { setupApiInterceptor } from './lib/apiInterceptor';

// Initialize in-browser API & Firebase bridge for flawless Netlify & offline execution
setupApiInterceptor();

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
