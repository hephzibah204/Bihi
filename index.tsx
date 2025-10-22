import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { initSupabase } from './services/supabaseClient';
import { getSubdomain } from './utils/subdomain';
import { DEMO_TENANT_ID } from './utils/demoData';
import { getAIService } from './services/aiService';
import { initializeSemanticCache } from './services/semanticSearchUtils';

const main = async () => {
    // Initialize Supabase before rendering the app. This ensures the `supabase`
    // client object is available for synchronous imports in other components.
    await initSupabase();

    // Initialize semantic cache for offline AI fallback
    try {
      initializeSemanticCache();
      console.log('✓ Semantic cache initialized for offline AI fallback');
    } catch (e) {
      console.warn('Semantic cache init failed:', e);
    }

    // Initialize AI service early to enable connection monitoring
    try {
      const aiService = getAIService();
      console.log('AI service initialized:', aiService.getStatus());
    } catch (e) {
      console.warn('AI service init failed:', e);
    }

    // Ensure demo-mode flag is consistently available for services relying on sessionStorage.
    try {
      const sub = getSubdomain();
      const isDemoLocal = (typeof window !== 'undefined') && (
        localStorage.getItem('isDemoMode') === 'true'
      );
      if (sub === DEMO_TENANT_ID || isDemoLocal) {
        sessionStorage.setItem('isDemoMode', 'true');
      }
    } catch (e) {
      console.warn('Demo-mode init failed:', e);
    }

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