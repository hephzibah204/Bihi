// utils/subdomain.ts
import { DEMO_TENANT_ID } from './demoData';

const ROOT_DOMAINS = ['reportsheet.com.ng', 'localhost'];

export const getSubdomain = (hostname: string): string | null => {
    
    // Handle specific development/preview hostnames first
    if (hostname.endsWith('.pages.dev') || hostname.endsWith('.vercel.app')) {
        const parts = hostname.split('.');
        if (parts.length > 2) {
            return parts[0];
        }
    }
    
    // Handle localhost development
    if (hostname.includes('localhost')) {
        const parts = hostname.split('.');
        if (parts.length > 1 && parts[0] !== 'localhost') {
            return parts[0];
        }
    }
    
    // Handle production domains
    for (const rootDomain of ROOT_DOMAINS) {
        if (hostname.endsWith(`.${rootDomain}`)) {
            const subdomain = hostname.substring(0, hostname.length - rootDomain.length - 1);
            if (subdomain && subdomain !== 'www') {
                return subdomain;
            }
        }
    }

    // If we've reached this point, we are on a root domain (or something unexpected).
    // NOW, we can check if we're in a demo session. This prevents the demo flag
    // from overriding a real subdomain.
    if (sessionStorage.getItem('isDemoMode') === 'true') {
        return DEMO_TENANT_ID; // 'demo'
    }

    // Otherwise, it's truly the root domain with no specific tenant.
    return null;
};
