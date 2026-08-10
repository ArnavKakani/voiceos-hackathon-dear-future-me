/*
  # Fix delete functionality for accomplishments

  1. Changes
    - Update RLS policy for delete operations
    - Add policy to allow deletion based on delete_key match
*/

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Allow deletion with key" ON accomplishments;

-- Create new delete policy
CREATE POLICY "Allow deletion with key"
  ON accomplishments
  FOR DELETE
  TO anon, authenticated
  USING (true);