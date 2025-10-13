Here are the SQL commands to fix the telephone_number issue:

```sql
-- Run these commands in your PostgreSQL database:

-- 1. Add telephone_number column if it doesn't exist
DO $$ 
BEGIN 
  BEGIN
    ALTER TABLE users ADD COLUMN telephone_number TEXT;
  EXCEPTION 
    WHEN duplicate_column THEN 
      NULL;
  END;
END $$;

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'telephone_number';
```

You can run these commands using:
1. pgAdmin if you have it installed
2. psql command line tool
3. Any other PostgreSQL client you're using

The DO block will safely add the column if it doesn't exist, and the SELECT query will verify that the column was added correctly.