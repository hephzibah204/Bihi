-- Backfill slug/subdomain routing fields in public.tenants based on id
-- This ensures previously created tenants have non-null routing identifiers.

DO $$
BEGIN
  -- Backfill slug
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='tenants' AND column_name='slug'
  ) THEN
    EXECUTE 'UPDATE public.tenants SET slug = COALESCE(slug, id) WHERE slug IS NULL';
  END IF;

  -- Backfill subdomain
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='tenants' AND column_name='subdomain'
  ) THEN
    EXECUTE 'UPDATE public.tenants SET subdomain = COALESCE(subdomain, id) WHERE subdomain IS NULL';
  END IF;

  -- Backfill alternate variant: domain
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='tenants' AND column_name='domain'
  ) THEN
    EXECUTE 'UPDATE public.tenants SET domain = COALESCE(domain, id) WHERE domain IS NULL';
  END IF;

  -- Backfill alternate variant: sub_domain
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='tenants' AND column_name='sub_domain'
  ) THEN
    EXECUTE 'UPDATE public.tenants SET sub_domain = COALESCE(sub_domain, id) WHERE sub_domain IS NULL';
  END IF;
END $$;