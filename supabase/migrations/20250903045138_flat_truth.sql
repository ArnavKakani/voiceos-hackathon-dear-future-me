/*
  # Auto-approve testimonials

  1. Changes
    - Update all existing testimonials to be approved
    - This ensures all previously submitted testimonials become visible

  2. Notes
    - Sets is_approved = true for all testimonials
    - Going forward, new testimonials will be auto-approved in the application code
*/

-- Approve all existing testimonials
UPDATE testimonials 
SET is_approved = true 
WHERE is_approved = false;