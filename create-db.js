const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the database file
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Delete the existing database file if it exists
if (fs.existsSync(dbPath)) {
  console.log('Removing existing database file...');
  fs.unlinkSync(dbPath);
  console.log('Database file removed.');
}

// Create a new database
const db = new Database(dbPath);

console.log('Creating database schema...');

// Create users table
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

// Create templates table
db.exec(`
  CREATE TABLE templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    is_premium INTEGER NOT NULL DEFAULT 0,
    price INTEGER DEFAULT 0,
    category TEXT NOT NULL,
    popularity INTEGER NOT NULL DEFAULT 0,
    html_content TEXT,
    css_content TEXT,
    js_content TEXT,
    created_by INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

// Create portfolios table
db.exec(`
  CREATE TABLE portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    template_id TEXT NOT NULL,
    personal_info BLOB NOT NULL,
    skills BLOB NOT NULL,
    projects BLOB NOT NULL,
    education BLOB NOT NULL,
    color_scheme BLOB NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    is_published INTEGER NOT NULL DEFAULT 0,
    is_premium_template INTEGER NOT NULL DEFAULT 0,
    is_purchased INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create template_purchases table
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

// Create admin user
db.exec(`
  INSERT INTO users (username, email, password, role)
  VALUES ('admin', 'admin@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'admin')
`);

// Create demo user
db.exec(`
  INSERT INTO users (username, email, password, role)
  VALUES ('user', 'user@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'user')
`);

// Create free template
db.exec(`
  INSERT INTO templates (
    name, description, thumbnail_url, is_premium, price, category, 
    html_content, css_content, js_content, created_by
  ) VALUES (
    'Minimalist',
    'A clean and simple template focusing on content. Free for all users.',
    '/thumbnails/minimalist.png',
    0,
    0,
    'General',
    '<!DOCTYPE html><html><head><title>{{personalInfo.firstName}} {{personalInfo.lastName}}</title></head><body><h1>{{personalInfo.firstName}} {{personalInfo.lastName}}</h1></body></html>',
    'body { font-family: sans-serif; }',
    '',
    1
  )
`);

// Create premium template
db.exec(`
  INSERT INTO templates (
    name, description, thumbnail_url, is_premium, price, category, 
    html_content, css_content, js_content, created_by
  ) VALUES (
    'Professional',
    'A premium template with advanced features and modern design. Requires purchase.',
    '/thumbnails/professional.png',
    1,
    1999,
    'Professional',
    '<!DOCTYPE html><html><head><title>{{personalInfo.firstName}} {{personalInfo.lastName}}</title></head><body><h1>{{personalInfo.firstName}} {{personalInfo.lastName}}</h1></body></html>',
    'body { font-family: "Roboto", "Helvetica Neue", sans-serif; }',
    '// Add some interactive features here',
    1
  )
`);

console.log('Database created successfully with one free and one premium template!');
db.close();
