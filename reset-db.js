const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const db = new Database(path.join(__dirname, '..', 'database.sqlite'));

// Function to check if a table exists
function tableExists(tableName) {
  const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
  return !!result;
}

// Create tables if they don't exist
function createTablesIfNeeded() {
  if (!tableExists('templates')) {
    console.log('Creating templates table...');
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
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
  }

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
        approved_by INTEGER
      )
    `);
  }
}

// Reset templates
function resetTemplates() {
  console.log('Deleting all templates...');
  db.prepare('DELETE FROM templates').run();
  
  // Basic HTML/CSS for templates
  const defaultHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ personalInfo.firstName }} {{ personalInfo.lastName }} - Portfolio</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>{{ personalInfo.firstName }} {{ personalInfo.lastName }}</h1>
        <h2>{{ personalInfo.headline }}</h2>
    </header>
    <section id="about">
        <h3>About Me</h3>
        <p>{{ personalInfo.about }}</p>
    </section>
    <section id="skills">
        <h3>Skills</h3>
        <ul>
            {{#each skills}}
            <li>{{ this.name }}</li>
            {{/each}}
        </ul>
    </section>
    <section id="projects">
        <h3>Projects</h3>
        {{#each projects}}
        <article>
            <h4>{{ this.title }}</h4>
            <p>{{ this.description }}</p>
        </article>
        {{/each}}
    </section>
    <section id="education">
        <h3>Education</h3>
        {{#each education}}
        <article>
            <h4>{{ this.institution }} - {{ this.degree }}</h4>
            <p>{{ this.startDate }} - {{ this.endDate | default: 'Present' }}</p>
        </article>
        {{/each}}
    </section>
    <footer>
        <p>Contact: {{ personalInfo.email }}</p>
    </footer>
</body>
</html>
`;

  const defaultCss = `
body {
    font-family: sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    background-color: {{ colorScheme.background | default: '#f4f4f4' }};
    color: {{ colorScheme.text | default: '#333' }};
}
header {
    background: {{ colorScheme.primary | default: '#333' }};
    color: #fff;
    padding: 1rem 0;
    text-align: center;
}
header h1 {
    margin: 0;
    font-size: 2.5rem;
}
header h2 {
    margin: 0;
    font-weight: 300;
}
section {
    padding: 1rem 2rem;
    margin: 1rem auto;
    max-width: 800px;
    background: #fff;
    border-radius: 5px;
}
h3 {
    color: {{ colorScheme.primary | default: '#333' }};
    border-bottom: 2px solid {{ colorScheme.accent | default: '#eee' }};
    padding-bottom: 0.5rem;
}
ul {
    list-style: none;
    padding: 0;
}
li {
    background: {{ colorScheme.secondary | default: '#eee' }};
    margin-bottom: 5px;
    padding: 5px 10px;
    border-radius: 3px;
}
article {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px dotted #ccc;
}
article:last-child {
    border-bottom: none;
}
footer {
    text-align: center;
    margin-top: 2rem;
    padding: 1rem;
    color: #666;
}
`;

  // Insert free template
  console.log('Adding free template...');
  db.prepare(`
    INSERT INTO templates (
      name, description, thumbnail_url, is_premium, price, category, 
      html_content, css_content, js_content
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Minimalist',
    'A clean and simple template focusing on content. Free for all users.',
    '/thumbnails/minimalist.png',
    0, // not premium
    0, // free
    'General',
    defaultHtml,
    defaultCss,
    '' // no JS
  );

  // Insert premium template
  console.log('Adding premium template...');
  const premiumCss = defaultCss.replace('sans-serif', '"Roboto", "Helvetica Neue", sans-serif');
  db.prepare(`
    INSERT INTO templates (
      name, description, thumbnail_url, is_premium, price, category, 
      html_content, css_content, js_content
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Professional',
    'A premium template with advanced features and modern design. Requires purchase.',
    '/thumbnails/professional.png',
    1, // premium
    1999, // $19.99
    'Professional',
    defaultHtml,
    premiumCss,
    '// Add some interactive features here'
  );

  console.log('Templates reset successfully!');
}

// Main function
function main() {
  try {
    createTablesIfNeeded();
    resetTemplates();
    console.log('Database reset completed successfully!');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    db.close();
  }
}

main();
