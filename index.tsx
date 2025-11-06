import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { getSubdomain } from './utils/subdomain';
import { DEMO_TENANT_ID } from './utils/demoData';
import { getAIService } from './services/aiService';
import { initializeSemanticCache } from './services/semanticSearchUtils';
import { logger } from './utils/logger';
import './styles/tailwind.css';

const main = async () => {

    // Initialize semantic cache for offline AI fallback
    try {
      initializeSemanticCache();
      logger.info('Semantic cache initialized for offline AI fallback');
    } catch (e) {
      logger.warn('Semantic cache init failed', { error: e as any });
    }

    // Initialize AI service early to enable connection monitoring
    try {
      const aiService = getAIService();
      logger.info('AI service initialized', { status: aiService.getStatus?.() });
    } catch (e) {
      logger.warn('AI service init failed', { error: e as any });
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
      logger.warn('Demo-mode init failed', { error: e as any });
    }

    // Ensure AI auto-routing is enabled site-wide by default
    try {
      // Do not allow forced offline mode at runtime
      (globalThis as any).__AI_FORCE_OFFLINE__ = false;

      const stored = localStorage.getItem('sitewide_ai_settings');
      let parsed: any = null;
      if (stored) {
        try { parsed = JSON.parse(stored); } catch (e) { /* ignore malformed JSON */ }
      }
      const nextSettings = {
        ...parsed,
        preferredProvider: 'auto',
        autoRouting: true,
        fallbackBehavior: parsed?.fallbackBehavior ?? 'always',
        complexityThreshold: parsed?.complexityThreshold ?? 'medium',
      };
      // Only write if not already auto-routing
      if (!parsed || parsed.preferredProvider !== 'auto' || parsed.autoRouting !== true) {
        localStorage.setItem('sitewide_ai_settings', JSON.stringify(nextSettings));
      }
    } catch (e) {
      logger.warn('Auto-routing init failed', { error: e as any });
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
        logger.error('Root element not found');
    }
};

main();