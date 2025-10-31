-- Add subscriptionStatus and trialEndDate columns to tenants
-- Ensures API writes like functions/api/register.js succeed without schema cache errors

BEGIN;

-- 0) Fix wrong-case columns if they were created without quotes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tenants' AND column_name='subscriptionstatus'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tenants' AND column_name='subscriptionStatus'
  ) THEN
    EXECUTE 'ALTER TABLE public.tenants RENAME COLUMN subscriptionstatus TO "subscriptionStatus"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tenants' AND column_name='trialenddate'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tenants' AND column_name='trialEndDate'
  ) THEN
    EXECUTE 'ALTER TABLE public.tenants RENAME COLUMN trialenddate TO "trialEndDate"';
  END IF;
END $$;

-- 1) Create column for subscription status with correct casing if missing
ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" text;

-- 2) Backfill NULLs to 'trial'
UPDATE public.tenants SET "subscriptionStatus" = 'trial' WHERE "subscriptionStatus" IS NULL;

-- 3) Set default for future inserts and enforce NOT NULL
ALTER TABLE IF EXISTS public.tenants
  ALTER COLUMN "subscriptionStatus" SET DEFAULT 'trial',
  ALTER COLUMN "subscriptionStatus" SET NOT NULL;

-- Optional: constrain allowed values (commented out to avoid breaking existing data)
-- ALTER TABLE public.tenants
--   ADD CONSTRAINT tenants_subscription_status_check
--   CHECK ("subscriptionStatus" IN ('trial','active','expired','canceled'));

-- 4) Trial end date (nullable)
ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS "trialEndDate" timestamptz NULL;

COMMIT;