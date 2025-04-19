import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the database file
const dbPath = path.join(__dirname, 'database.sqlite');

// Create a backup of the database
if (fs.existsSync(dbPath)) {
  const backupPath = `${dbPath}.backup-${Date.now()}`;
  console.log(`Creating backup of database at ${backupPath}`);
  fs.copyFileSync(dbPath, backupPath);
}

// Connect to the database
const db = new Database(dbPath);

// Function to check if a table exists
function tableExists(tableName) {
  const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
  return !!result;
}

// Main function
function fixDatabase() {
  try {
    console.log('Checking database schema...');
    
    // Check and create template_purchases table if it doesn't exist
    if (!tableExists('template_purchases')) {
      console.log('Creating template_purchases table...');
      db.exec(`
        CREATE TABLE template_purchases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          template_id INTEGER NOT NULL,
          portfolio_id INTEGER,
          status TEXT NOT NULL DEFAULT 'pending',
          requested_at INTEGER NOT NULL DEFAULT (unixepoch()),
          approved_at INTEGER,
          approved_by INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (template_id) REFERENCES templates(id),
          FOREIGN KEY (portfolio_id) REFERENCES portfolios(id),
          FOREIGN KEY (approved_by) REFERENCES users(id)
        )
      `);
      
      // Create indexes for faster lookups
      db.exec(`CREATE INDEX IF NOT EXISTS idx_template_purchases_user_id ON template_purchases(user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_template_purchases_template_id ON template_purchases(template_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_template_purchases_status ON template_purchases(status)`);
      
      console.log('template_purchases table created successfully with indexes');
    } else {
      console.log('template_purchases table already exists');
      
      // Drop and recreate the table to ensure it has the correct schema
      console.log('Dropping and recreating template_purchases table...');
      db.exec(`DROP TABLE template_purchases`);
      
      db.exec(`
        CREATE TABLE template_purchases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          template_id INTEGER NOT NULL,
          portfolio_id INTEGER,
          status TEXT NOT NULL DEFAULT 'pending',
          requested_at INTEGER NOT NULL DEFAULT (unixepoch()),
          approved_at INTEGER,
          approved_by INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (template_id) REFERENCES templates(id),
          FOREIGN KEY (portfolio_id) REFERENCES portfolios(id),
          FOREIGN KEY (approved_by) REFERENCES users(id)
        )
      `);
      
      // Create indexes for faster lookups
      db.exec(`CREATE INDEX IF NOT EXISTS idx_template_purchases_user_id ON template_purchases(user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_template_purchases_template_id ON template_purchases(template_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_template_purchases_status ON template_purchases(status)`);
      
      console.log('template_purchases table recreated successfully with indexes');
    }
    
    console.log('Database fix completed successfully!');
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    db.close();
  }
}

// Run the main function
fixDatabase();
