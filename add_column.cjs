require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';"))
  .then(() => { console.log('Column added successfully'); client.end() })
  .catch(err => { console.error('Error adding column:', err.message); client.end() });
