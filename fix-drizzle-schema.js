import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the database file
const dbPath = path.join(__dirname, 'database.sqlite');

// Check if the database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// Connect to the database
const sqlite = new Database(dbPath);

// Run the migration SQL from 0003_template_purchases.sql
try {
  console.log('Applying template_purchases migration...');
  
  const migrationPath = path.join(__dirname, 'migrations', '0003_template_purchases.sql');
  
  if (fs.existsSync(migrationPath)) {
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    sqlite.exec(migrationSQL);
    console.log('Migration applied successfully');
  } else {
    console.log('Migration file not found, creating table manually...');
    
    // Create template_purchases table if it doesn't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS template_purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        template_id INTEGER NOT NULL REFERENCES templates(id),
        portfolio_id INTEGER REFERENCES portfolios(id),
        status TEXT NOT NULL DEFAULT 'pending',
        requested_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
        approved_at INTEGER,
        approved_by INTEGER REFERENCES users(id)
      );
      
      -- Create indexes for faster lookups
      CREATE INDEX IF NOT EXISTS idx_template_purchases_user_id ON template_purchases(user_id);
      CREATE INDEX IF NOT EXISTS idx_template_purchases_template_id ON template_purchases(template_id);
      CREATE INDEX IF NOT EXISTS idx_template_purchases_status ON template_purchases(status);
    `);
    
    console.log('Table created manually');
  }
  
  console.log('Drizzle schema fix completed successfully!');
} catch (error) {
  console.error('Error fixing Drizzle schema:', error);
} finally {
  sqlite.close();
}
