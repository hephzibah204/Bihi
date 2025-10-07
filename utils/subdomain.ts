// utils/subdomain.ts
import { DEMO_TENANT_ID } from './demoData';

const ROOT_DOMAINS = ['reportsheet.com.ng', 'localhost'];

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

    // 5. If on root domain, check for a demo session
    // This prevents the demo flag from overriding a real subdomain.
    if (sessionStorage.getItem('isDemoMode') === 'true') {
        return DEMO_TENANT_ID; // 'demo'
    }

    // 6. Otherwise, it's truly the root domain with no specific tenant.
    return null;
};
