import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the database file
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Check if the database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// Connect to the database
const db = new Database(dbPath);

// Function to check if a column exists in a table
function columnExists(tableName, columnName) {
  const result = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return result.some(column => column.name === columnName);
}

// Main function
function fixPortfolioSchema() {
  try {
    console.log('Checking portfolios table schema...');
    
    // Check if is_premium_template column exists
    if (!columnExists('portfolios', 'is_premium_template')) {
      console.log('Adding is_premium_template column to portfolios table...');
      db.prepare('ALTER TABLE portfolios ADD COLUMN is_premium_template INTEGER DEFAULT 0 NOT NULL').run();
      console.log('Added is_premium_template column');
    } else {
      console.log('is_premium_template column already exists');
    }
    
    // Check if is_purchased column exists
    if (!columnExists('portfolios', 'is_purchased')) {
      console.log('Adding is_purchased column to portfolios table...');
      db.prepare('ALTER TABLE portfolios ADD COLUMN is_purchased INTEGER DEFAULT 0 NOT NULL').run();
      console.log('Added is_purchased column');
    } else {
      console.log('is_purchased column already exists');
    }
    
    // Check if experience column exists
    if (!columnExists('portfolios', 'experience')) {
      console.log('Adding experience column to portfolios table...');
      db.prepare('ALTER TABLE portfolios ADD COLUMN experience TEXT DEFAULT "[]"').run();
      console.log('Added experience column');
    } else {
      console.log('experience column already exists');
    }
    
    console.log('Portfolio schema fixed successfully!');
  } catch (error) {
    console.error('Error fixing portfolio schema:', error);
  } finally {
    db.close();
  }
}

fixPortfolioSchema();
