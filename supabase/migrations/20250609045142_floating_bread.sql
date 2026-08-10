/*
  # Fix letter_counts table policies

  1. Security
    - Add INSERT policy for anonymous users to initialize counter
    - Ensure UPDATE policy exists for counter increments
    - Keep SELECT policy for reading counter values

  2. Changes
    - Allow anonymous users to insert initial counter record
    - Allow anonymous users to update counter values
    - Maintain read access for all users
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert letter counts" ON letter_counts;
DROP POLICY IF EXISTS "Anyone can update letter counts" ON letter_counts;
DROP POLICY IF EXISTS "Anyone can view letter counts" ON letter_counts;

-- Create new policies that allow anonymous access
CREATE POLICY "Anyone can insert letter counts"
  ON letter_counts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update letter counts"
  ON letter_counts
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view letter counts"
  ON letter_counts
  FOR SELECT
  TO anon, authenticated
  USING (true);