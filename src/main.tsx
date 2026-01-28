import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Comprehensive error logging
console.log('[Taskbed] Starting application...');
console.log('[Taskbed] Location:', window.location.href);
console.log('[Taskbed] User Agent:', navigator.userAgent);

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error('[Taskbed] Global error:', { message, source, lineno, colno, error });
  return false;
};

// Unhandled promise rejection handler
window.onunhandledrejection = function(event) {
  console.error('[Taskbed] Unhandled promise rejection:', event.reason);
};

// Log when scripts fail to load
document.addEventListener('error', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
    console.error('[Taskbed] Resource failed to load:', {
      tagName: target.tagName,
      src: (target as HTMLScriptElement).src || (target as HTMLLinkElement).href,
      error: e
    });
  }
}, true);

try {
  console.log('[Taskbed] Looking for root element...');
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('[Taskbed] Root element not found!');
    document.body.innerHTML = '<div style="padding: 20px; font-family: system-ui;"><h1>Error</h1><p>Root element not found</p></div>';
  } else {
    console.log('[Taskbed] Root element found, creating React root...');
    const root = createRoot(rootElement);

    console.log('[Taskbed] Rendering App...');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('[Taskbed] App rendered successfully');
  }
} catch (error) {
  console.error('[Taskbed] Failed to initialize app:', error);
  document.body.innerHTML = `<div style="padding: 20px; font-family: system-ui;">
    <h1>Application Error</h1>
    <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error}</pre>
  </div>`;
}
