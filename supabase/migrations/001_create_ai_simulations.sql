CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.ai_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  subject TEXT,
  keywords TEXT[],
  provider TEXT DEFAULT 'PhET',
  attribution TEXT DEFAULT 'PhET Interactive Simulations, University of Colorado Boulder',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
