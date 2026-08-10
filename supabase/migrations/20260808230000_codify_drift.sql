-- Codify columns and functions that exist in production but were missing from migrations.
ALTER TABLE journals
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'note';

ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS tags text[];

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT false;

CREATE OR REPLACE FUNCTION count_community_letters()
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT count(*)::integer FROM journals WHERE type = 'letter';
$$;

-- These policies allowed unrestricted destructive writes.
DROP POLICY IF EXISTS "Allow deletion with key" ON accomplishments;
DROP POLICY IF EXISTS "Allow thanksgiving gratitude deletion with key" ON thanksgiving_gratitude;
DROP POLICY IF EXISTS "Anyone can update letter counts" ON letter_counts;
