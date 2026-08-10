/*
  # Comprehensive Platform Schema

  1. New Tables
    - `profiles` - User profile information
    - `journals` - User journal entries
    - `testimonials` - User testimonials with moderation
    - `feedback` - Anonymous feedback submissions
    - `letter_counts` - Track letter copy counts

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
    - Allow anonymous feedback submissions
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create journals table
CREATE TABLE IF NOT EXISTS journals (
  journal_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  entry_date timestamptz DEFAULT now(),
  title text,
  content text NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  testimonial_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  testimonial_content text NOT NULL,
  author_name text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  feedback_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_at timestamptz DEFAULT now(),
  feedback_content text NOT NULL,
  category text DEFAULT 'general',
  email text
);

-- Create letter_counts table
CREATE TABLE IF NOT EXISTS letter_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  copy_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert initial letter count record
INSERT INTO letter_counts (copy_count) VALUES (0) ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_counts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Journals policies
CREATE POLICY "Users can view own journals"
  ON journals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public journals"
  ON journals FOR SELECT
  TO authenticated, anon
  USING (is_public = true);

CREATE POLICY "Users can insert own journals"
  ON journals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journals"
  ON journals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journals"
  ON journals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Testimonials policies
CREATE POLICY "Anyone can view approved testimonials"
  ON testimonials FOR SELECT
  TO authenticated, anon
  USING (is_approved = true);

CREATE POLICY "Users can insert testimonials"
  ON testimonials FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can view own testimonials"
  ON testimonials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Anyone can insert feedback"
  ON feedback FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Letter counts policies
CREATE POLICY "Anyone can view letter counts"
  ON letter_counts FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can update letter counts"
  ON letter_counts FOR UPDATE
  TO authenticated, anon
  USING (true);

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to increment letter count
CREATE OR REPLACE FUNCTION public.increment_letter_count()
RETURNS void AS $$
BEGIN
  UPDATE letter_counts 
  SET copy_count = copy_count + 1, updated_at = now()
  WHERE id = (SELECT id FROM letter_counts LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;