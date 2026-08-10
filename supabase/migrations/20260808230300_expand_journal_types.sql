-- Production had an undocumented check constraint limited to the original
-- three web entry types. Replace it with the complete API/voice type set.
ALTER TABLE journals
  DROP CONSTRAINT IF EXISTS journals_type_check;

ALTER TABLE journals
  ADD CONSTRAINT journals_type_check
  CHECK (
    type IN (
      'letter',
      'note',
      'accomplishment',
      'reflection',
      'memory',
      'proud_moment',
      'time_capsule'
    )
  ) NOT VALID;

ALTER TABLE journals
  VALIDATE CONSTRAINT journals_type_check;
