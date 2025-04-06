import { db } from './db';
import { templates, users } from '@shared/schema';
import { eq, count } from 'drizzle-orm';
import { storage } from './storage'; // To potentially get admin user ID

// Basic HTML/CSS for a default template
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

async function seedDatabase() {
  console.log('Checking if seeding is needed...');

  // Check if templates already exist
  const templateCountResult = await db.select({ value: count() }).from(templates).get();
  const templateCount = templateCountResult?.value ?? 0;

  if (templateCount > 0) {
    console.log('Templates already exist. Seeding not required.');
    return;
  }

  console.log('No templates found. Seeding default template...');

  // Find the admin user to associate the template with (optional, but good practice)
  let adminUserId: number | undefined;
  try {
    const adminUser = await storage.getUserByUsername('admin');
    if (adminUser) {
      adminUserId = adminUser.id;
    } else {
      console.warn("Admin user 'admin' not found. Template will be created without an owner.");
    }
  } catch (error) {
    console.error("Error fetching admin user:", error);
    console.warn("Proceeding to create template without an owner.");
  }

  // Define the default template data
  const defaultTemplateData = {
    name: 'Minimalist',
    description: 'A clean and simple template focusing on content.',
    thumbnailUrl: '/thumbnails/minimalist.png', // Placeholder path
    isPremium: false,
    price: 0,
    category: 'General',
    htmlContent: defaultHtml,
    cssContent: defaultCss,
    jsContent: '', // No JS for this simple template
    createdBy: adminUserId, // Link to admin if found
  };

  try {
    await db.insert(templates).values(defaultTemplateData).run();
    console.log('Default template seeded successfully!');
  } catch (error) {
    console.error('Error seeding default template:', error);
  }
}

seedDatabase()
  .then(() => {
    console.log('Seeding process finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding process failed:', error);
    process.exit(1);
  });
