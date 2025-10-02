const ROOT_DOMAIN = 'reportsheet.com.ng';

export const getSubdomain = (hostname) => {
    // Check for demo mode via sessionStorage flag
    if (sessionStorage.getItem('isDemoMode') === 'true') {
        return 'demo';
    }
    
    // Handle localhost development
    if (hostname.includes('.localhost')) {
        return hostname.split('.localhost')[0];
    }
    // Handle production domain
    if (hostname.endsWith(ROOT_DOMAIN)) {
        const parts = hostname.split(`.${ROOT_DOMAIN}`);
        const subdomain = parts[0];
        // Ensure 'www' or empty subdomains are not treated as tenants
        if (subdomain && subdomain !== 'www' && subdomain !== '') {
            return subdomain;
        }
    }
    return null;
};