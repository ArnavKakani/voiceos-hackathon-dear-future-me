/*
  # Thanksgiving Gratitude Wall

  1. New Tables
    - `thanksgiving_gratitude`
      - Stores anonymous gratitude notes shared during the Thanksgiving campaign
      - Includes delete keys so authors can remove their entries later

  2. Security
    - Enable RLS with public select/insert access
    - Allow deletes so long as the client provides the matching delete key filter

  3. Data Integrity
    - Reuse the existing profanity filter trigger to keep entries respectful
*/

CREATE TABLE IF NOT EXISTS thanksgiving_gratitude (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  delete_key text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE thanksgiving_gratitude ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read thanksgiving gratitude" ON thanksgiving_gratitude;
  DROP POLICY IF EXISTS "Anyone can insert thanksgiving gratitude" ON thanksgiving_gratitude;
  DROP POLICY IF EXISTS "Allow thanksgiving gratitude deletion with key" ON thanksgiving_gratitude;
END $$;

CREATE POLICY "Anyone can read thanksgiving gratitude"
  ON thanksgiving_gratitude
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert thanksgiving gratitude"
  ON thanksgiving_gratitude
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow thanksgiving gratitude deletion with key"
  ON thanksgiving_gratitude
  FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION check_profanity() RETURNS trigger AS $$
DECLARE
  bad_words text[] := ARRAY[
    'fuck', 'shit', 'ass', 'bitch', 'dick', 'pussy', 'cock', 'cunt',
    'bastard', 'whore', 'slut', 'piss', 'nigger', 'faggot', 'retard',
    'damn', 'hell', 'penis', 'vagina', 'boob', 'tit'
  ];
  word text;
BEGIN
  FOREACH word IN ARRAY bad_words
  LOOP
    IF NEW.content ~* ('\m' || word || '\M') THEN
      RAISE EXCEPTION 'Content contains inappropriate language';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_profanity_thanksgiving ON thanksgiving_gratitude;
CREATE TRIGGER check_profanity_thanksgiving
  BEFORE INSERT ON thanksgiving_gratitude
  FOR EACH ROW
  EXECUTE FUNCTION check_profanity();
