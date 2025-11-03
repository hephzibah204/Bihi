// scripts/validate-teacher-schema.js
// Validates presence of teachers table and required columns using Supabase REST pg_meta

import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${SERVICE_KEY}`,
  apikey: SERVICE_KEY,
  Accept: 'application/json'
};

async function main() {
  console.log('Checking teachers table schema...\n');
  // Check table existence by querying pg_meta
  const metaUrl = `${SUPABASE_URL}/rest/v1/pg_meta.columns?select=name,table,schema&table=eq.teachers&schema=eq.public`;
  const res = await fetch(metaUrl, { headers });
  if (!res.ok) {
    console.error('❌ Unable to access pg_meta.columns:', res.status, await res.text());
    process.exit(1);
  }
  const cols = await res.json();
  if (!Array.isArray(cols) || cols.length === 0) {
    console.error('❌ Teachers table not found or has no columns');
    process.exit(1);
  }
  console.log('✓ Teachers table exists');

  const names = new Set(cols.map(c => c.name));
  const required = ['email', 'tenant_id', 'role'];
  const recommended = ['auth_id', 'full_name', 'name'];

  console.log('\nColumn Analysis:');
  for (const col of required) {
    if (names.has(col)) console.log(`✓ ${col} (required)`);
    else console.log(`❌ ${col} (MISSING - REQUIRED)`);
  }
  for (const col of recommended) {
    if (names.has(col)) console.log(`✓ ${col} (recommended)`);
    else console.log(`⚠ ${col} (missing - recommended)`);
  }
  console.log('\nAll columns found:', Array.from(names).join(', '));
}

main().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
