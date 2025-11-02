-- Update existing job_seeker values to Professional
UPDATE users
SET user_type = 'Professional'
WHERE user_type = 'job_seeker';