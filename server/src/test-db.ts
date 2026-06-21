import { sql } from 'drizzle-orm';
import { db } from './db';
import { randomUUID } from 'node:crypto';

async function run() {
  try {
    const result = await db.execute(sql`
      INSERT INTO users (
        id, email, password, user_type, first_name, last_name,
        location, profile_photo, telephone_number, created_at
      ) VALUES (
        ${randomUUID()},
        'test@example.com',
        'password123',
        'Professional',
        'Test',
        'User',
        NULL,
        NULL,
        NULL,
        ${new Date()}
      ) RETURNING *
    `);
    console.log("Success:", result.rows[0]);
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

run();
