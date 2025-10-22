// utils/domainTest.ts
// Utility to test domain flexibility and configuration

import { getSubdomain, getPortalUrl, isProductionDomain, getDomainConfiguration } from './subdomain';

export interface DomainTestResult {
  domain: string;
  subdomain: string | null;
  portalUrl: string;
  isProduction: boolean;
  config: any;
  status: 'pass' | 'fail';
  message: string;
}

/**
 * Test domain configuration with different scenarios
 */
export function testDomainConfiguration(): DomainTestResult[] {
  const results: DomainTestResult[] = [];
  
  // Store original location
  const originalLocation = window.location;
  
  // Test scenarios
  const testCases = [
    {
      hostname: 'localhost',
      pathname: '/',
      search: '',
      expected: null,
      description: 'Localhost root should return null'
    },
    {
      hostname: 'localhost',
      pathname: '/brightstar',
      search: '',
      expected: 'brightstar',
      description: 'Localhost with clean path should return tenant'
    },
    {
      hostname: 'localhost',
      pathname: '/brightstar/dashboard',
      search: '',
      expected: 'brightstar',
      description: 'Localhost with clean path + sub-route should return tenant'
    },
    {
      hostname: 'localhost',
      pathname: '/',
      search: '?tenant=testschool',
      expected: 'testschool',
      description: 'Localhost with tenant param should return tenant (fallback)'
    },
    {
      hostname: 'testschool.localhost',
      pathname: '/',
      search: '',
      expected: 'testschool',
      description: 'Localhost subdomain should work'
    },
    {
      hostname: 'brightstar.myschoolapp.com',
      pathname: '/',
      search: '',
      expected: 'brightstar',
      description: 'Production subdomain should work'
    },
    {
      hostname: 'myschoolapp.com',
      pathname: '/riverside',
      search: '',
      expected: 'riverside',
      description: 'Production domain with clean path should work'
    },
    {
      hostname: 'myschoolapp.com',
      pathname: '/riverside/students',
      search: '',
      expected: 'riverside',
      description: 'Production domain with clean path + sub-route should work'
    },
    {
      hostname: 'myschoolapp.com',
      pathname: '/',
      search: '?tenant=riverside',
      expected: 'riverside',
      description: 'Production domain with tenant param should work (fallback)'
    },
    {
      hostname: 'preview.pages.dev',
      pathname: '/',
      search: '',
      expected: 'preview',
      description: 'Pages.dev subdomain should work'
    }
  ];
  
  testCases.forEach(testCase => {
    try {
      // Mock window.location for testing
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          hostname: testCase.hostname,
          pathname: testCase.pathname,
          search: testCase.search,
          protocol: 'https:',
          port: ''
        },
        writable: true
      });
      
      const subdomain = getSubdomain();
      const config = getDomainConfiguration();
      const isProduction = isProductionDomain();
      
      const result: DomainTestResult = {
        domain: testCase.hostname,
        subdomain,
        portalUrl: subdomain ? getPortalUrl(subdomain) : '',
        isProduction,
        config,
        status: subdomain === testCase.expected ? 'pass' : 'fail',
        message: testCase.description
      };
      
      results.push(result);
      
    } catch (error) {
      results.push({
        domain: testCase.hostname,
        subdomain: null,
        portalUrl: '',
        isProduction: false,
        config: {},
        status: 'fail',
        message: `Error testing ${testCase.hostname}: ${error.message}`
      });
    }
  });
  
  // Restore original location
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true
  });
  
  return results;
}

/**
 * Run domain tests and log results to console
 */
export function runDomainTests(): void {
  console.group('🧪 Domain Configuration Tests');
  
  const results = testDomainConfiguration();
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(`${icon} ${result.message}`);
    console.log(`   Domain: ${result.domain}`);
    console.log(`   Detected: ${result.subdomain}`);
    console.log(`   Production: ${result.isProduction}`);
    if (result.portalUrl) {
      console.log(`   Portal URL: ${result.portalUrl}`);
    }
    console.log('---');
  });
  
  const passed = results.filter(r => r.status === 'pass').length;
  const total = results.length;
  
  console.log(`📊 Results: ${passed}/${total} tests passed`);
  console.groupEnd();
}

/**
 * Get current domain status for debugging
 */
export function getCurrentDomainStatus() {
  const subdomain = getSubdomain();
  const config = getDomainConfiguration();
  const isProduction = isProductionDomain();
  
  return {
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    search: window.location.search,
    detectedSubdomain: subdomain,
    isProductionDomain: isProduction,
    configuration: config,
    portalUrl: subdomain ? getPortalUrl(subdomain) : null
  };
}

// Make functions available globally for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testDomainConfig = runDomainTests;
  (window as any).getDomainStatus = getCurrentDomainStatus;
}