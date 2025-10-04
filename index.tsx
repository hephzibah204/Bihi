import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      {/* Fix: Resolved ErrorBoundary component type errors which in turn fixed the implicit error here. No code changes needed in this file, but including for context of the fix. */}
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} else {
    console.error("Root element not found");
}