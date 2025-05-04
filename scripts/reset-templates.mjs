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

// Function to check if a table exists
function tableExists(tableName) {
  const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
  return !!result;
}

// Main function
function resetTemplates() {
  try {
    // Check if templates table exists
    if (!tableExists('templates')) {
      console.error('Templates table does not exist in the database');
      return;
    }

    // Delete all existing templates
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

    // Get admin user ID if available
    let adminUserId = null;
    try {
      const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
      if (adminUser) {
        adminUserId = adminUser.id;
      }
    } catch (error) {
      console.log('Could not find admin user:', error);
    }

    // Insert free template
    console.log('Adding free template...');
    db.prepare(`
      INSERT INTO templates (
        name, description, thumbnail_url, is_premium, price, category, 
        html_content, css_content, js_content, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Minimalist',
      'A clean and simple template focusing on content. Free for all users.',
      '/thumbnails/minimalist.png',
      0, // not premium
      0, // free
      'General',
      defaultHtml,
      defaultCss,
      '', // no JS
      adminUserId
    );

    // Insert premium template
    console.log('Adding premium template...');
    const premiumCss = defaultCss.replace('sans-serif', '"Roboto", "Helvetica Neue", sans-serif');
    db.prepare(`
      INSERT INTO templates (
        name, description, thumbnail_url, is_premium, price, category, 
        html_content, css_content, js_content, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Professional',
      'A premium template with advanced features and modern design. Requires purchase.',
      '/https://res.cloudinary.com/dmygblav6/image/upload/v1746379831/07002e0c-86ef-4722-995d-ffac6264fdcb.png',
      1, // premium
      1999, // $19.99
      'Professional',
      defaultHtml,
      premiumCss,
      '// Add some interactive features here',
      adminUserId
    );

    console.log('Templates reset successfully with one free and one premium template!');
  } catch (error) {
    console.error('Error resetting templates:', error);
  } finally {
    db.close();
  }
}

resetTemplates();
