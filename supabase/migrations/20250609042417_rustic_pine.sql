/*
  # Update letters table to support user association

  1. Changes
    - Add user_id column to letters table (optional for anonymous letters)
    - Add foreign key constraint to users table
    - Update RLS policies to allow users to see their own letters

  2. Security
    - Maintain existing anonymous functionality
    - Add user-specific access for authenticated users
*/

-- Add user_id column to letters table (nullable for anonymous letters)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'letters' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE letters ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update RLS policies for letters
DROP POLICY IF EXISTS "Anyone can insert letters" ON letters;
DROP POLICY IF EXISTS "Anyone can read letters" ON letters;

-- Allow anyone to insert letters (anonymous or authenticated)
CREATE POLICY "Anyone can insert letters"
  ON letters
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to read their own letters, and maintain anonymous access
CREATE POLICY "Users can read own letters"
  ON letters
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous reading for letters without user_id (backwards compatibility)
CREATE POLICY "Anyone can read anonymous letters"
  ON letters
  FOR SELECT
  TO anon, authenticated
  USING (user_id IS NULL);