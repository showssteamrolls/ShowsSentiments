// swallow ResizeObserver loop errors so CRA’s overlay never triggers
window.addEventListener('error', event => {
    if (
      event.message &&
      event.message.includes('ResizeObserver loop completed')
    ) {
      event.stopImmediatePropagation();
    }
  });
  
  import React from 'react';
  import { createRoot } from 'react-dom/client';
  import App from './App';
  import './styles/index.css';
  
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(<App />);
  