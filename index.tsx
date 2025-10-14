import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { initSupabase } from './services/supabaseClient';

const main = async () => {
    // Initialize Supabase before rendering the app. This ensures the `supabase`
    // client object is available for synchronous imports in other components.
    await initSupabase();

    const container = document.getElementById('root');
    if (container) {
      const root = createRoot(container);
      root.render(
        <StrictMode>
          <BrowserRouter>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </BrowserRouter>
        </StrictMode>
      );
    } else {
        console.error("Root element not found");
    }
};

main();