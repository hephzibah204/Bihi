import { describe, it, expect, vi } from 'vitest';

// Integration test placeholder for registration flow.
// NOTE: This test is skipped by default; enable when env and network are configured.

describe.skip('Registration Flow', () => {
  it('should create tenant, auth user, and teacher profile', async () => {
    const testSubdomain = `test-${Date.now()}`;
    const testEmail = `admin-${Date.now()}@test.com`;

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Test School',
        subdomain: testSubdomain,
        adminEmail: testEmail,
        adminPassword: 'TestPass123!',
        adminName: 'Test Admin',
        schoolType: 'secondary'
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.teacherProfileCreated).toBe(true);
    expect(data.warning).toBeUndefined();
  });
});
