-- Remove trailing numeric suffixes from demo-seeded job titles (e.g. "Frontend Developer 9")
UPDATE jobs
SET title = regexp_replace(title, '\s+\d+$', '', 'g')
WHERE title ~ '\s+\d+$';
