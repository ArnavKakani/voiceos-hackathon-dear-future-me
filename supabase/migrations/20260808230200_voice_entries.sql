ALTER TABLE journals
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS transcript text,
  ADD COLUMN IF NOT EXISTS audio_path text,
  ADD COLUMN IF NOT EXISTS revisit_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS context text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS provenance text DEFAULT 'USER_MEMORY';

CREATE INDEX IF NOT EXISTS journals_fts_idx ON journals
  USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

CREATE INDEX IF NOT EXISTS journals_revisit_idx ON journals (revisit_at)
  WHERE revisit_at IS NOT NULL;

CREATE OR REPLACE FUNCTION search_entries(
  search_query text,
  requesting_user_id uuid,
  entry_kind text DEFAULT NULL
)
RETURNS SETOF journals
LANGUAGE sql
STABLE
AS $$
  SELECT j.*
  FROM journals AS j
  WHERE j.user_id = requesting_user_id
    AND (entry_kind IS NULL OR j.type = entry_kind)
    AND to_tsvector('english', coalesce(j.title, '') || ' ' || coalesce(j.content, ''))
        @@ websearch_to_tsquery('english', search_query)
  ORDER BY ts_rank(
    to_tsvector('english', coalesce(j.title, '') || ' ' || coalesce(j.content, '')),
    websearch_to_tsquery('english', search_query)
  ) DESC,
  j.created_at DESC;
$$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-audio', 'voice-audio', false)
ON CONFLICT (id) DO UPDATE SET public = false;
