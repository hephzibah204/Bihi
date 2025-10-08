// utils/subdomain.ts
import { DEMO_TENANT_ID } from './demoData';

const ROOT_DOMAINS = ['reportsheet.com.ng', 'localhost'];
const PREVIEW_ROOT_DOMAIN = 'reportsheet.pages.dev'; // Explicitly define the preview root

export const getSubdomain = (): string | null => {
    // 1. Prioritize tenant query parameter for simulation/testing
    const params = new URLSearchParams(window.location.search);
    const tenantParam = params.get('tenant');
    if (tenantParam) {
        // When using a tenant param, also clear demo mode to avoid conflicts
        sessionStorage.removeItem('isDemoMode');
        return tenantParam;
    }

    const hostname = window.location.hostname;

    // NEW: Explicitly treat the main preview domain as a root domain
    if (hostname === PREVIEW_ROOT_DOMAIN) {
        return null;
    }
    
    // 2. Handle specific development/preview hostnames
    if (hostname.endsWith('.pages.dev') || hostname.endsWith('.vercel.app')) {
        const parts = hostname.split('.');
        if (parts.length > 2) {
            return parts[0];
        }
    }
    
    // 3. Handle localhost development
    if (hostname.includes('localhost')) {
        const parts = hostname.split('.');
        if (parts.length > 1 && parts[0] !== 'localhost') {
            return parts[0];
        }
    }
    
    // 4. Handle production domains
    for (const rootDomain of ROOT_DOMAINS) {
        if (hostname.endsWith(`.${rootDomain}`)) {
            const subdomain = hostname.substring(0, hostname.length - rootDomain.length - 1);
            if (subdomain && subdomain !== 'www') {
                return subdomain;
            }
        }
    }

    // 5. If on the absolute root path with no query parameters, never assume a demo tenant.
    // This ensures the marketing page is always accessible, even if a demo flag is leftover in session.
    if (window.location.pathname === '/' && window.location.search === '') {
        return null;
    }

    // 6. If there are query params (like ?view=demo) or a different path,
    // we can now safely check for the demo session flag.
    if (sessionStorage.getItem('isDemoMode') === 'true') {
        return DEMO_TENANT_ID; // 'demo'
    }

    // 7. Otherwise, it's truly the root domain with no specific tenant.
    return null;
};