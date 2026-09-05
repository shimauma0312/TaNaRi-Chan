-- Fail rather than silently merge accounts if legacy data differs only by case.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "User"
    GROUP BY lower("user_email")
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot normalize user emails: case-insensitive duplicates exist';
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS citext;
ALTER TABLE "User"
  ALTER COLUMN "user_email" TYPE CITEXT
  USING lower("user_email")::citext;
