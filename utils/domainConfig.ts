// utils/domainConfig.ts
// Flexible domain configuration for any deployment domain

interface DomainConfig {
  rootDomains: string[];
  previewDomain?: string;
  useSubdomains: boolean;
  protocol: string;
}

// Get domain configuration from environment variables
export const getDomainConfig = (): DomainConfig => {
  // Default to current domain logic, but make it configurable
  const defaultRootDomains = ['reportsheet.com.ng', 'localhost'];
  const envRootDomains = process.env.VITE_ROOT_DOMAINS?.split(',') || [];
  
  return {
    rootDomains: envRootDomains.length > 0 ? envRootDomains : defaultRootDomains,
    previewDomain: process.env.VITE_PREVIEW_DOMAIN || 'reportsheet.pages.dev',
    useSubdomains: process.env.VITE_USE_SUBDOMAINS !== 'false', // Default true
    protocol: process.env.VITE_PROTOCOL || 'https:'
  };
};

// Updated subdomain detection that works with any domain
export const getSubdomainForAnyDomain = (): string | null => {
  const config = getDomainConfig();
  
  // 1. Prioritize tenant query parameter
  const params = new URLSearchParams(window.location.search);
  const tenantParam = params.get('tenant');
  if (tenantParam) {
    sessionStorage.removeItem('isDemoMode');
    return tenantParam;
  }

  const hostname = window.location.hostname;

  // 2. Handle preview domain
  if (config.previewDomain && hostname === config.previewDomain) {
    return null;
  }
  
  // 3. Handle development/preview hostnames
  if (hostname.includes('.pages.dev') || hostname.includes('.vercel.app') || hostname.includes('.netlify.app')) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
  }
  
  // 4. Handle localhost development
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0];
    }
    
    // Localhost path fallback
    const pathSegment = window.location.pathname.split('/')[1];
    if (pathSegment) {
      return pathSegment;
    }
  }
  
  // 5. Handle configured production domains
  for (const rootDomain of config.rootDomains) {
    if (hostname.endsWith(`.${rootDomain}`)) {
      const subdomain = hostname.substring(0, hostname.length - rootDomain.length - 1);
      if (subdomain && subdomain !== 'www') {
        return subdomain;
      }
    }
  }

  // 6. Root path check
  if (window.location.pathname === '/') {
    return null;
  }

  // 7. Demo mode check
  if (sessionStorage.getItem('isDemoMode') === 'true') {
    return 'demo';
  }

  return null;
};

// Generate portal URL for any configured domain
export const getPortalUrlForAnyDomain = (subdomain: string): string => {
  const config = getDomainConfig();
  const hostname = window.location.hostname;
  const protocol = config.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';

  // Check if current hostname is one of the configured root domains
  const isConfiguredRootDomain = config.rootDomains.some(domain => 
    hostname === domain || hostname === `www.${domain}`
  );

  if (isConfiguredRootDomain && config.useSubdomains) {
    // Use subdomain format for configured production domains
    const rootDomain = config.rootDomains.find(domain => 
      hostname === domain || hostname === `www.${domain}`
    );
    return `${protocol}//${subdomain}.${rootDomain}${port}`;
  }

  // For all other cases (localhost, preview domains, etc.), use query param
  return `${protocol}//${hostname}${port}/?tenant=${subdomain}`;
};

// Check if current domain is production
export const isProductionDomain = (): boolean => {
  const config = getDomainConfig();
  const hostname = window.location.hostname;
  
  return config.rootDomains.some(domain => 
    hostname === domain || hostname === `www.${domain}`
  ) && !hostname.includes('localhost');
};