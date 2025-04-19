import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
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
    }
    
    // Apply the migration from 0003_template_purchases.sql if needed
    console.log('Checking portfolios table for premium template columns...');
    
    // Check if portfolios table has is_premium_template column
    const portfolioColumns = db.prepare(`PRAGMA table_info(portfolios)`).all();
    const hasPremiumColumn = portfolioColumns.some(col => col.name === 'is_premium_template');
    const hasPurchasedColumn = portfolioColumns.some(col => col.name === 'is_purchased');
    
    if (!hasPremiumColumn) {
      console.log('Adding is_premium_template column to portfolios table...');
      db.exec(`ALTER TABLE portfolios ADD COLUMN is_premium_template INTEGER NOT NULL DEFAULT 0`);
    }
    
    if (!hasPurchasedColumn) {
      console.log('Adding is_purchased column to portfolios table...');
      db.exec(`ALTER TABLE portfolios ADD COLUMN is_purchased INTEGER NOT NULL DEFAULT 0`);
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
