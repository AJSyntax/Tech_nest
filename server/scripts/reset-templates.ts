import { db } from '../db';
import { templates, templatePurchases } from '@shared/schema';
import { storage } from '../storage';

async function resetTemplates() {
  console.log('Resetting templates...');

  try {
    // First, delete all template purchases to avoid foreign key constraints
    console.log('Deleting template purchases...');
    try {
      await db.delete(templatePurchases).run();
      console.log('All template purchases deleted.');
    } catch (error) {
      console.error('Error deleting template purchases:', error);
      // Continue with the process even if this fails
    }

    // Now delete all existing templates
    console.log('Deleting templates...');
    await db.delete(templates).run();
    console.log('All templates deleted.');

    // Find the admin user to associate the template with
    let adminUserId: number | undefined;
    try {
      const adminUser = await storage.getUserByUsername('admin');
      if (adminUser) {
        adminUserId = adminUser.id;
      } else {
        console.warn("Admin user 'admin' not found. Templates will be created without an owner.");
      }
    } catch (error) {
      console.error("Error fetching admin user:", error);
    }

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

    // Define the free template data
    const freeTemplateData = {
      name: 'Minimalist',
      description: 'A clean and simple template focusing on content. Free for all users.',
      thumbnailUrl: 'https://res.cloudinary.com/dmygblav6/image/upload/v1746380703/adf9b97f-8a33-4476-b939-5020d1e5c7e7.png',
      isPremium: false,
      price: 0,
      category: 'General',
      htmlContent: defaultHtml,
      cssContent: defaultCss,
      jsContent: '',
      createdBy: adminUserId,
    };

    // Define the premium template data
    const premiumTemplateData = {
      name: 'Professional',
      description: 'A premium template with advanced features and modern design. Requires purchase.',
      thumbnailUrl: 'https://res.cloudinary.com/dmygblav6/image/upload/v1746379831/07002e0c-86ef-4722-995d-ffac6264fdcb.png',
      isPremium: true,
      price: 1999, // $19.99
      category: 'Professional',
      htmlContent: defaultHtml,
      cssContent: defaultCss.replace('sans-serif', '"Roboto", "Helvetica Neue", sans-serif'),
      jsContent: '// Add some interactive features here',
      createdBy: adminUserId,
    };

    // Insert the two templates
    await db.insert(templates).values(freeTemplateData).run();
    await db.insert(templates).values(premiumTemplateData).run();

    console.log('Templates reset successfully with one free and one premium template.');
  } catch (error) {
    console.error('Error resetting templates:', error);
  }
}

resetTemplates()
  .then(() => {
    console.log('Reset process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Reset process failed:', error);
    process.exit(1);
  });
