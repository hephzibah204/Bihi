// utils/health.ts
// Minimal runtime health check for dev and ops use.

export async function checkEnvironmentHealth() {
  const results: Record<string, any> = {};
  try {
    const tenantsRes = await fetch('/api/tenant-exists?subdomain=demo');
    results.tenantCheck = await tenantsRes.json();
  } catch (e: any) {
    results.tenantCheck = { error: String(e) };
  }
  return results;
}

export default checkEnvironmentHealth;