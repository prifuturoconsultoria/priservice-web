-- Migration: Add Azure AD support to profiles table
-- Purpose: Support authentication via Azure AD / Spring Boot backend
-- Date: 2026-01-05

-- Add azure_user_id column to store backend user ID
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS azure_user_id INTEGER;

-- Add constraint to make email unique (required for email-based lookup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_email_unique'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_email_unique UNIQUE (email);
  END IF;
END $$;

-- Add index for email lookups (performance)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add index for azure_user_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_azure_user_id ON profiles(azure_user_id);

-- Add comment to explain the migration
COMMENT ON COLUMN profiles.azure_user_id IS 'User ID from Spring Boot backend (Azure AD)';

-- Display migration success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 016: Azure AD profiles migration completed successfully';
  RAISE NOTICE '  - Added azure_user_id column';
  RAISE NOTICE '  - Added unique constraint on email';
  RAISE NOTICE '  - Created performance indexes';
  RAISE NOTICE '  - Existing profiles remain unchanged';
END $$;
