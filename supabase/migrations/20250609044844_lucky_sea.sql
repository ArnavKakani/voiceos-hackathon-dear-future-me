/*
  # Update letter count to start at 56

  1. Database Changes
    - Update the existing letter_counts record to have copy_count = 56
    - If no record exists, create one with copy_count = 56
    - This ensures the counter starts at 56 and increments from there (57, 58, etc.)

  2. Notes
    - This migration will set the base count to 56
    - Future increments will show 57, 58, 59, etc.
*/

-- Update existing record or insert new one with copy_count = 56
INSERT INTO letter_counts (copy_count) 
VALUES (56)
ON CONFLICT (id) 
DO UPDATE SET 
  copy_count = 56,
  updated_at = now();

-- If there's no existing record, this will create one
-- If there is an existing record, this will update it to 56
DO $$
BEGIN
  -- Check if any records exist
  IF NOT EXISTS (SELECT 1 FROM letter_counts) THEN
    INSERT INTO letter_counts (copy_count) VALUES (56);
  ELSE
    -- Update the first record to 56
    UPDATE letter_counts 
    SET copy_count = 56, updated_at = now() 
    WHERE id = (SELECT id FROM letter_counts LIMIT 1);
  END IF;
END $$;