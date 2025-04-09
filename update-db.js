import Database from 'better-sqlite3';

// Open the database
const db = new Database('database.sqlite');

// Execute the migration
try {
  // Add new fields to users table one by one to avoid SQLite limitations
  try { db.exec(`ALTER TABLE users ADD COLUMN email TEXT DEFAULT '';`); } catch (e) { console.log('Email column already exists or error:', e.message); }
  try { db.exec(`ALTER TABLE users ADD COLUMN is_email_verified INTEGER DEFAULT 0;`); } catch (e) { console.log('is_email_verified column already exists or error:', e.message); }
  try { db.exec(`ALTER TABLE users ADD COLUMN verification_token TEXT;`); } catch (e) { console.log('verification_token column already exists or error:', e.message); }
  try { db.exec(`ALTER TABLE users ADD COLUMN verification_token_expiry INTEGER;`); } catch (e) { console.log('verification_token_expiry column already exists or error:', e.message); }
  try { db.exec(`ALTER TABLE users ADD COLUMN reset_token TEXT;`); } catch (e) { console.log('reset_token column already exists or error:', e.message); }
  try { db.exec(`ALTER TABLE users ADD COLUMN reset_token_expiry INTEGER;`); } catch (e) { console.log('reset_token_expiry column already exists or error:', e.message); }
  try { db.exec(`ALTER TABLE users ADD COLUMN secret_question TEXT;`); } catch (e) { console.log('secret_question column already exists or error:', e.message); }
  try { db.exec(`ALTER TABLE users ADD COLUMN secret_answer TEXT;`); } catch (e) { console.log('secret_answer column already exists or error:', e.message); }
  try { db.exec(`ALTER TABLE users ADD COLUMN created_at INTEGER;`); } catch (e) { console.log('created_at column already exists or error:', e.message); }

  // Set default timestamps for existing records
  try { db.exec(`UPDATE users SET created_at = strftime('%s', 'now') WHERE created_at IS NULL;`); } catch (e) { console.log('Error updating created_at:', e.message); }

  // Create unique index on email
  try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);`); } catch (e) { console.log('Error creating email index:', e.message); }

  // Update existing users with default email
  try { db.exec(`UPDATE users SET email = username || '@example.com' WHERE email = '' OR email IS NULL;`); } catch (e) { console.log('Error updating default emails:', e.message); }

  console.log('✅ Database schema updated successfully');
} catch (error) {
  console.error('❌ Error updating database schema:', error);
} finally {
  db.close();
}
