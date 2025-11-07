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

// Strict root domain parsing and validation
const parseRootDomains = (): string[] => {
  const raw =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ROOT_DOMAINS) ||
    (typeof window !== 'undefined' && (window as any).ENV?.VITE_ROOT_DOMAINS) ||
    '';
  return String(raw)
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
};

export const getSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null;

  // Demo mode shortcut
  if (sessionStorage.getItem('isDemoMode') === 'true' || localStorage.getItem('isDemoMode') === 'true') {
    return DEMO_TENANT_ID;
  }

  const config = getDomainConfig();
  const host = window.location.hostname.toLowerCase();
  const roots = parseRootDomains();
  const url = new URL(window.location.href);

  // Fallback safe defaults if not configured
  const effectiveRoots = roots.length > 0 ? roots : ['reportsheet.com.ng', 'localhost'];

  const root = effectiveRoots.find((r) => host === r || host.endsWith(`.${r}`));

  // If using path/query-based routing, try to resolve from URL params/segments first
  if (!config.useSubdomains) {
    const qp = (url.searchParams.get('tenant') || url.searchParams.get('school') || url.searchParams.get('portal') || '').trim().toLowerCase();
    if (qp) return normalizeSubdomain(qp);

    const firstSegment = url.pathname.split('/').filter(Boolean)[0];
    if (firstSegment && firstSegment !== 'controlhub') {
      return normalizeSubdomain(firstSegment);
    }

    // As a fallback, still attempt subdomain extraction if host matches a root domain
    if (root && host !== root) {
      const sub = host.slice(0, host.length - root.length - 1);
      return normalizeSubdomain(sub);
    }

    // No match found
    return null;
  }

  // Using subdomain-based routing
  if (!root) {
    console.error('[Multi-tenant] Host does not match any configured ROOT_DOMAINS', { host, effectiveRoots });
    return null;
  }

  if (host === root) return null;

  // strip ".root"
  const sub = host.slice(0, host.length - root.length - 1);
  return normalizeSubdomain(sub) || null;
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
