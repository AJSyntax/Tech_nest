import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Open the database
const db = new Database('database.sqlite');

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the migration SQL
const migrationSQL = fs.readFileSync(
  path.join(__dirname, '..', 'migrations', 'add_user_fields.sql'),
  'utf-8'
);

// Execute the migration
try {
  db.exec(migrationSQL);
  console.log('✅ Migration completed successfully');
} catch (error) {
  console.error('❌ Error during migration:', error);
  process.exit(1);
} finally {
  db.close();
}
