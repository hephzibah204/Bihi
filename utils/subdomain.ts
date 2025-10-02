const ROOT_DOMAIN = 'reportsheet.com.ng';

export const getSubdomain = (hostname: string): string | null => {
    // Check for demo mode via sessionStorage flag first
    if (sessionStorage.getItem('isDemoMode') === 'true') {
        return 'demo';
    }
    
    // Handle localhost development
    if (hostname.includes('localhost')) {
        const parts = hostname.split('.');
        // For 'school.localhost:port' or 'school.localhost'
        if (parts.length > 1 && parts[0] !== 'localhost') {
            return parts[0];
        }
        // For 'localhost:port'
        return null;
    }
    
    // Handle production domains
    // Explicitly check for the root domain and www variant
    if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
        return null;
    }
    
    // Extract the subdomain part if it exists
    if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
        return hostname.replace(`.${ROOT_DOMAIN}`, '');
    }

    // Fallback for any other cases
    return null;
};
