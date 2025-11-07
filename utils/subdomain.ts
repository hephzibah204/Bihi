// utils/subdomain.ts
// Domain-agnostic subdomain detection that works with any domain configuration

import { DEMO_TENANT_ID } from './demoData';

interface DomainConfig {
  rootDomains: string[];
  previewDomain?: string;
  useSubdomains: boolean;
  protocol: string;
}

// Get domain configuration from environment variables
const getDomainConfig = (): DomainConfig => {
  // Support both build-time and runtime environment variables
  const getRootDomains = () => {
    // Check build-time environment variables first
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ROOT_DOMAINS) {
      return import.meta.env.VITE_ROOT_DOMAINS.split(',').map((d: string) => d.trim());
    }
    // Fallback to runtime if available
    if (typeof window !== 'undefined' && (window as any).ENV?.VITE_ROOT_DOMAINS) {
      return (window as any).ENV.VITE_ROOT_DOMAINS.split(',').map((d: string) => d.trim());
    }
    // Default domains
    return ['reportsheet.com.ng', 'localhost'];
  };

  const getPreviewDomain = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PREVIEW_DOMAIN) {
      return import.meta.env.VITE_PREVIEW_DOMAIN;
    }
    if (typeof window !== 'undefined' && (window as any).ENV?.VITE_PREVIEW_DOMAIN) {
      return (window as any).ENV.VITE_PREVIEW_DOMAIN;
    }
    return 'reportsheet.pages.dev';
  };

  const getUseSubdomains = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_SUBDOMAINS !== undefined) {
      return import.meta.env.VITE_USE_SUBDOMAINS !== 'false';
    }
    if (typeof window !== 'undefined' && (window as any).ENV?.VITE_USE_SUBDOMAINS !== undefined) {
      return (window as any).ENV.VITE_USE_SUBDOMAINS !== 'false';
    }
    return true; // Default to using subdomains
  };

  const getProtocol = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PROTOCOL) {
      return import.meta.env.VITE_PROTOCOL;
    }
    if (typeof window !== 'undefined' && (window as any).ENV?.VITE_PROTOCOL) {
      return (window as any).ENV.VITE_PROTOCOL;
    }
    // Auto-detect protocol from current page
    if (typeof window !== 'undefined') {
      return window.location.protocol;
    }
    return 'https:';
  };
  
  return {
    rootDomains: getRootDomains(),
    previewDomain: getPreviewDomain(),
    useSubdomains: getUseSubdomains(),
    protocol: getProtocol()
  };
};

export const getSubdomain = (): string | null => {
  const config = getDomainConfig();
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // 0. Check demo mode FIRST - highest priority
  if (sessionStorage.getItem('isDemoMode') === 'true' || localStorage.getItem('isDemoMode') === 'true') {
    return DEMO_TENANT_ID;
  }

  // 1. Handle subdomain-based routing first (most common for production)
  // Check if hostname has subdomain and is a configured root domain
  for (const rootDomain of config.rootDomains) {
    if (hostname.endsWith(`.${rootDomain}`)) {
      const subdomain = hostname.substring(0, hostname.length - rootDomain.length - 1);
      if (subdomain && subdomain !== 'www') {
        return subdomain;
      }
    }
  }
  
  // 2. Handle development/preview hostnames with subdomains
  if (hostname.includes('.pages.dev') || hostname.includes('.vercel.app') || hostname.includes('.netlify.app')) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
  }
  
  // 3. Handle localhost subdomain development
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0];
    }
  }

  // 4. Handle clean path-based routing (e.g., /tenant-name/dashboard)
  const pathSegments = pathname.split('/').filter(segment => segment !== '');
  if (pathSegments.length > 0) {
    const firstSegment = pathSegments[0];
    
    // Skip system paths that are not tenant names
    const systemPaths = ['dashboard', 'login', 'signup', 'demo', 'signin', 'results', 'controlhub', 'api', 'admin'];
    
    if (!systemPaths.includes(firstSegment)) {
      // Clear demo mode when accessing tenant via path
      sessionStorage.removeItem('isDemoMode');
      return firstSegment;
    }
  }

  // 5. Fallback to query parameter for backward compatibility
  const params = new URLSearchParams(window.location.search);
  const tenantParam = params.get('tenant');
  if (tenantParam) {
    sessionStorage.removeItem('isDemoMode');
    return tenantParam;
  }

  // 6. Handle preview domain
  if (config.previewDomain && hostname === config.previewDomain) {
    return null;
  }

  return null;
};

export const getPortalUrl = (subdomain: string): string => {
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
    ) || config.rootDomains[0];
    return `${protocol}//${subdomain}.${rootDomain}${port}`;
  }

  // For all other cases, use clean path-based URLs
  return `${protocol}//${hostname}${port}/${subdomain}`;
};

// Check if current domain is production
export const isProductionDomain = (): boolean => {
  const config = getDomainConfig();
  const hostname = window.location.hostname;
  
  return config.rootDomains.some(domain => 
    hostname === domain || hostname === `www.${domain}`
  ) && !hostname.includes('localhost');
};

// Export domain config for other components to use
export const getDomainConfiguration = getDomainConfig;

// Normalize subdomain input to a safe slug
export const normalizeSubdomain = (input: string): string => {
  const trimmed = String(input || '').trim().toLowerCase();
  // Replace invalid characters with hyphen and collapse repeats
  const sanitized = trimmed.replace(/[^a-z0-9-]/g, '-').replace(/-{2,}/g, '-');
  // Remove leading/trailing hyphens
  return sanitized.replace(/^-+/, '').replace(/-+$/, '');
};

// Validate subdomain against routing rules
export const isValidSubdomain = (sub: string): boolean => {
  const s = normalizeSubdomain(sub);
  if (!s) return false;
  // Length constraints
  if (s.length < 3 || s.length > 63) return false;
  // Must start with letter or number
  if (!/^[a-z0-9]/.test(s)) return false;
  // No consecutive dots (not used) or invalid patterns
  if (/\.\./.test(s)) return false;
  // Disallow reserved names
  const reserved = new Set(['www', 'admin', 'api']);
  if (reserved.has(s)) return false;
  // Valid character set already enforced in normalize
  return /^[a-z0-9-]+$/.test(s);
};
