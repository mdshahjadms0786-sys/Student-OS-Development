import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { ThemeProvider } from './lib/theme.js';
import { Toaster } from 'sonner';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="system">
        <App />
        <Toaster />
      </ThemeProvider>
    </React.StrictMode>
  );
}
