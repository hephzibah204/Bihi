import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const envLocal = path.join(root, '.env.local')
const envDefault = path.join(root, '.env')
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal })
else if (fs.existsSync(envDefault)) dotenv.config({ path: envDefault })
else dotenv.config()

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

if (!url || !key) {
  console.error('Missing Supabase env vars: VITE_SUPABASE_URL and ANON/PUBLISHABLE key')
  process.exit(1)
}

const supabase = createClient(url, key)

const tableChecks = {
  platform_settings: ['id'],
  profiles: ['id', 'full_name', 'avatar_url', 'phone', 'timezone', 'language', 'two_factor_enabled', 'email_notifications', 'updated_at'],
  students: ['id'],
  teachers: ['id'],
  parents: ['id'],
  admissions: ['id'],
  scores: ['id'],
  teacher_attendance: ['id'],
  scratch_cards: ['cards'],
  settings: ['id'],
  timetable: ['id'],
  conversations: ['id'],
  messages: ['id'],
  shared_lesson_plans: ['id'],
  class_sessions: ['id'],
  teacher_ratings: ['id'],
  ai_coach_course_completions: ['id'],
  ai_coach_watch_time: ['id'],
  ai_coach_certificates: ['id'],
  ai_simulations: ['id'],
  ai_conversations: ['id'],
  ai_messages: ['id'],
  voice_sessions: ['id'],
  files: ['id', 'tenant_id', 'linked_type', 'linked_id', 'r2_key', 'mime_type', 'size_bytes'],
  user_tenants: ['tenant_id'],
  invoices: ['id'],
  payments: ['id'],
  expenses: ['id'],
  income: ['id'],
  attendance: ['id'],
  remarks: ['id']
}

const buckets = ['school-assets', 'uploads']

async function checkTable(name, cols) {
  const selectClause = cols.join(',')
  const { error } = await supabase.from(name).select(selectClause).limit(1)
  if (error) return { name, ok: false, message: error.message }
  return { name, ok: true }
}

async function checkBucket(name) {
  const { data, error } = await supabase.storage.from(name).list('', { limit: 1 })
  if (error) return { name, ok: false, message: error.message }
  return { name, ok: true, count: Array.isArray(data) ? data.length : 0 }
}

async function main() {
  const tableResults = []
  for (const [name, cols] of Object.entries(tableChecks)) {
    try {
      tableResults.push(await checkTable(name, cols))
    } catch (e) {
      tableResults.push({ name, ok: false, message: String(e) })
    }
  }

  const bucketResults = []
  for (const name of buckets) {
    try {
      bucketResults.push(await checkBucket(name))
    } catch (e) {
      bucketResults.push({ name, ok: false, message: String(e) })
    }
  }

  let hasErrors = false
  console.log('Supabase schema verification')
  console.log('Endpoint:', url)
  console.log('Tables:')
  for (const r of tableResults) {
    if (r.ok) console.log(`  ${r.name}: OK`)
    else {
      hasErrors = true
      console.log(`  ${r.name}: ERROR - ${r.message}`)
    }
  }
  console.log('Buckets:')
  for (const r of bucketResults) {
    if (r.ok) console.log(`  ${r.name}: OK (${r.count} items visible)`) 
    else {
      hasErrors = true
      console.log(`  ${r.name}: ERROR - ${r.message}`)
    }
  }
  if (hasErrors) process.exitCode = 1
}

await main()
