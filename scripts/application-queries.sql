-- Create application (user applies to a job)
INSERT INTO applications (
  job_id,
  applicant_id,
  status,
  cover_letter,
  resume,
  notes
)
VALUES ($1, $2, COALESCE($3, 'applied'), $4, $5, $6)
RETURNING *;

-- Fetch one user's applications with full live job + company + applicant details
SELECT
  a.*,
  j.id AS job_id,
  j.title AS job_title,
  j.description AS job_description,
  j.requirements AS job_requirements,
  j.location AS job_location,
  j.job_type AS job_type,
  j.salary_min AS salary_min,
  j.salary_max AS salary_max,
  j.skills AS job_skills,
  j.company_id AS job_company_id,
  j.employer_id AS job_employer_id,
  j.is_active AS job_is_active,
  j.created_at AS job_created_at,
  u.id AS applicant_id,
  u.email AS applicant_email,
  u.first_name AS applicant_first_name,
  u.last_name AS applicant_last_name,
  u.user_type AS applicant_user_type,
  u.location AS applicant_location,
  c.id AS company_id,
  c.name AS company_name,
  c.website AS company_website,
  c.location AS company_location,
  c.industry AS company_industry,
  c.size AS company_size
FROM applications a
LEFT JOIN jobs j ON a.job_id = j.id
LEFT JOIN users u ON a.applicant_id = u.id
LEFT JOIN companies c ON j.company_id = c.id
WHERE a.applicant_id = $1
ORDER BY a.applied_at DESC;

-- Fetch all applications for one job (employer side)
SELECT
  a.*,
  u.id AS applicant_id,
  u.first_name AS applicant_first_name,
  u.last_name AS applicant_last_name,
  u.email AS applicant_email,
  u.location AS applicant_location
FROM applications a
JOIN users u ON a.applicant_id = u.id
WHERE a.job_id = $1
ORDER BY a.applied_at DESC;

-- Fetch all applications across all jobs posted by one employer
SELECT
  a.*,
  j.id AS job_id,
  j.title AS job_title,
  c.id AS company_id,
  c.name AS company_name,
  u.id AS applicant_id,
  u.first_name AS applicant_first_name,
  u.last_name AS applicant_last_name,
  u.email AS applicant_email
FROM applications a
JOIN jobs j ON a.job_id = j.id
LEFT JOIN companies c ON j.company_id = c.id
JOIN users u ON a.applicant_id = u.id
WHERE j.employer_id = $1
ORDER BY a.applied_at DESC;

-- Update application status (review pipeline)
UPDATE applications
SET
  status = $2,
  notes = COALESCE($3, notes),
  updated_at = NOW()
WHERE id = $1
RETURNING *;

-- Optional: prevent duplicate applications per user/job
-- Run once in migration:
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_job_applicant_unique
--   ON applications(job_id, applicant_id);
