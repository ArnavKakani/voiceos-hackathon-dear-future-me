/*
  # Initial Schema Creation

  1. New Tables
    - `accomplishments`
      - `id` (uuid, primary key)
      - `text` (text, required)
      - `created_at` (timestamptz, auto)
    - `letters`
      - `id` (uuid, primary key)
      - `text` (text, required)
      - `created_at` (timestamptz, auto)
    - `vision_boards`
      - `id` (uuid, primary key)
      - `icons` (json, required)
      - `created_at` (timestamptz, auto)

  2. Security
    - Enable RLS on all tables
    - Add public read access for anonymous display
    - Add insert policies for anonymous submissions
*/

-- Create accomplishments table
CREATE TABLE IF NOT EXISTS accomplishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create letters table
CREATE TABLE IF NOT EXISTS letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create vision_boards table
CREATE TABLE IF NOT EXISTS vision_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icons jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_boards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read accomplishments" ON accomplishments;
  DROP POLICY IF EXISTS "Anyone can insert accomplishments" ON accomplishments;
  DROP POLICY IF EXISTS "Anyone can read letters" ON letters;
  DROP POLICY IF EXISTS "Anyone can insert letters" ON letters;
  DROP POLICY IF EXISTS "Anyone can read vision_boards" ON vision_boards;
  DROP POLICY IF EXISTS "Anyone can insert vision_boards" ON vision_boards;
END $$;

-- Create RLS policies for Accomplishments
CREATE POLICY "Anyone can read accomplishments" 
  ON accomplishments 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Anyone can insert accomplishments" 
  ON accomplishments 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- Create RLS policies for Letters
CREATE POLICY "Anyone can read letters" 
  ON letters 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Anyone can insert letters" 
  ON letters 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- Create RLS policies for Vision Boards
CREATE POLICY "Anyone can read vision_boards" 
  ON vision_boards 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Anyone can insert vision_boards" 
  ON vision_boards 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);