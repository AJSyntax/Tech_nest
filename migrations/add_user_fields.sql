-- Add new fields to users table
ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN is_email_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN verification_token TEXT;
ALTER TABLE users ADD COLUMN verification_token_expiry INTEGER;
ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expiry INTEGER;
ALTER TABLE users ADD COLUMN secret_question TEXT;
ALTER TABLE users ADD COLUMN secret_answer TEXT;
ALTER TABLE users ADD COLUMN created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'));

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
