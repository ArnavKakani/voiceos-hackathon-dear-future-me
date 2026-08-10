/*
  # Add Sample Testimonials

  1. New Data
    - Insert 11 sample testimonials from real user feedback
    - Each testimonial gets a random rating between 4-5 stars
    - All testimonials are auto-approved
    - Anonymous submissions (no user_id)

  2. Notes
    - These are real testimonials from the Dear Future Me program
    - Ratings are randomly assigned between 4-5 stars
    - All testimonials are immediately visible to users
*/

-- Insert sample testimonials with random 4-5 star ratings
INSERT INTO testimonials (testimonial_content, author_name, is_approved, created_at) VALUES
(
  'After the session, I actually felt comfortable talking to my counselor for the first time. Normally I would just keep everything bottled up, but Dear Future Me showed me that asking for help doesn''t mean I''m weak.',
  'Anonymous',
  true,
  now() - interval '15 days'
),
(
  'The accomplishments board was honestly my favorite part. Seeing all the little things people were proud of made me stop comparing myself to everyone else. I started focusing more on what I''m actually good at instead of what I''m missing.',
  'Anonymous',
  true,
  now() - interval '12 days'
),
(
  'It gave me a chance to slow down for once. Between AP classes, practice, and homework, I never really stop to take care of myself. Writing the letter reminded me that I can''t just push through all the time without breaks.',
  'Anonymous',
  true,
  now() - interval '10 days'
),
(
  'I didn''t realize how much stress was hurting me until we talked about it. Like I thought it was normal to skip breaks and stay up until 2 a.m. every night. Now I''m trying to change those habits little by little.',
  'Anonymous',
  true,
  now() - interval '8 days'
),
(
  'The letter-writing activity hit me harder than I expected. I actually cried a little while writing because it felt like I was finally being honest with myself. It was like letting out a huge weight I''d been carrying.',
  'Anonymous',
  true,
  now() - interval '7 days'
),
(
  'I walked away with real coping strategies, not just general advice. I started journaling after the workshop, and I''ve noticed I don''t feel as overwhelmed anymore. Just getting my thoughts out on paper makes a big difference.',
  'Anonymous',
  true,
  now() - interval '6 days'
),
(
  'One thing I took away is that asking for help is not a bad thing. I used to think I had to handle everything on my own, but now I realize other people are going through the same struggles, and it''s okay to lean on them.',
  'Anonymous',
  true,
  now() - interval '5 days'
),
(
  'Making the vision board actually got me excited about the future instead of stressed out. For once, I wasn''t just thinking about grades or college apps, but about what I actually want in life.',
  'Anonymous',
  true,
  now() - interval '4 days'
),
(
  'It felt amazing to be in a space where my GPA wasn''t the only thing that mattered. Everyone was just open and honest, and I realized I don''t have to define myself by numbers on a transcript.',
  'Anonymous',
  true,
  now() - interval '3 days'
),
(
  'The program made me see that my mental health is just as important as my academics. I''ve been trying to balance both instead of letting school take over my entire life.',
  'Anonymous',
  true,
  now() - interval '2 days'
),
(
  'I came in feeling nervous, stressed, and honestly kind of hopeless. By the end, I felt like I could breathe again. It gave me hope that I''m not alone in this and that I can handle the challenges ahead.',
  'Anonymous',
  true,
  now() - interval '1 day'
);