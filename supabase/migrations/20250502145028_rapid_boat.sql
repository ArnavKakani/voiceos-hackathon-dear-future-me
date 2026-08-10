/*
  # Add delete functionality and profanity filter to accomplishments

  1. Changes
    - Add delete_key column to accomplishments table
    - Add profanity filter function
    - Add trigger to check content before insert
*/

-- Create profanity filter function
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

-- Add delete_key column
ALTER TABLE accomplishments 
ADD COLUMN IF NOT EXISTS delete_key text;

-- Create trigger for profanity check
DROP TRIGGER IF EXISTS check_profanity_trigger ON accomplishments;
CREATE TRIGGER check_profanity_trigger
  BEFORE INSERT ON accomplishments
  FOR EACH ROW
  EXECUTE FUNCTION check_profanity();

-- Update policies to allow deletion with delete_key
DROP POLICY IF EXISTS "Allow deletion with key" ON accomplishments;
CREATE POLICY "Allow deletion with key"
  ON accomplishments
  FOR DELETE
  TO anon, authenticated
  USING (delete_key = current_setting('app.delete_key', true));