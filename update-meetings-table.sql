-- Update meetings table to use username instead of supabase_user_id
ALTER TABLE meetings 
ADD COLUMN username VARCHAR(50) NULL AFTER supabase_user_id;

-- Create index on username for faster lookups
CREATE INDEX idx_meetings_username ON meetings(username);

-- Update existing records to use username from profiles table (if needed)
-- This is a placeholder - you would need to run this manually with actual data
-- UPDATE meetings m
-- JOIN profiles p ON m.supabase_user_id = p.id
-- SET m.username = p.username
-- WHERE m.username IS NULL;
