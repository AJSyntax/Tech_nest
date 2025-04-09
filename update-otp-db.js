import Database from 'better-sqlite3';

// Open the database
const db = new Database('database.sqlite');

// Execute the migration
try {
  // Add OTP fields to users table
  try { db.exec(`ALTER TABLE users ADD COLUMN otp_code TEXT;`); } catch (e) { console.log('otp_code column already exists or error:', e.message); }
  try { db.exec(`ALTER TABLE users ADD COLUMN otp_expiry INTEGER;`); } catch (e) { console.log('otp_expiry column already exists or error:', e.message); }

  console.log('✅ Database schema updated successfully with OTP fields');
} catch (error) {
  console.error('❌ Error updating database schema:', error);
} finally {
  db.close();
}
