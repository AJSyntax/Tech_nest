import { saveAs } from 'file-saver';
import { PortfolioFormData } from '@/types/portfolio';
import { generateHtml } from '@/utils/htmlGenerator';
import { createZipFile } from '@/utils/fileUtils';

/**
 * Generates and downloads a ZIP file containing the portfolio website
 * @param portfolio The portfolio data to include in the website
 * @param templateName The name of the template used
 */
export async function generatePortfolioZip(
  portfolio: PortfolioFormData,
  templateName: string
): Promise<void> {
  try {
    // Generate the main HTML file content
    const indexHtml = generateHtml(portfolio, templateName);
    
    // Create file objects for the ZIP
    const files: { name: string; content: string | Blob }[] = [
      {
        name: 'index.html',
        content: indexHtml
      },
      {
        name: 'css/styles.css',
        content: generateCss(portfolio)
      },
      {
        name: 'js/main.js',
        content: generateJs()
      },
      {
        name: 'README.md',
        content: generateReadme(portfolio, templateName)
      }
    ];
    
    // Generate ZIP file from these files
    const zipBlob = await createZipFile(files);
    
    // Save the ZIP file with a clean filename
    const fileName = `${cleanFileName(portfolio.name || 'my-portfolio')}.zip`;
    saveAs(zipBlob, fileName);
    
  } catch (error) {
    console.error('Error generating portfolio ZIP:', error);
    throw new Error('Failed to generate portfolio ZIP file');
  }
}

/**
 * Generates CSS content based on portfolio color scheme
 */
export function generateCss(portfolio: PortfolioFormData): string {
  const { colorScheme } = portfolio;
  
  return `
/* Generated styles for ${portfolio.name} portfolio */
:root {
  --primary-color: ${colorScheme.primary};
  --secondary-color: ${colorScheme.secondary};
  --accent-color: ${colorScheme.accent};
  --background-color: ${colorScheme.background};
  --text-color: ${colorScheme.text};
  --heading-font: 'Inter', sans-serif;
  --body-font: 'Inter', sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--body-font);
  color: var(--text-color);
  background-color: var(--background-color);
  line-height: 1.6;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

header {
  background-color: var(--primary-color);
  color: white;
  padding: 2rem 0;
}

nav {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
}

nav ul {
  display: flex;
  list-style: none;
  gap: 1.5rem;
}

nav a {
  color: white;
  text-decoration: none;
  transition: opacity 0.2s;
}

nav a:hover {
  opacity: 0.8;
}

.hero {
  display: flex;
  align-items: center;
  padding: 2rem 0;
}

.hero-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
}

.hero-content {
  margin-left: 2rem;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--heading-font);
  margin-bottom: 1rem;
}

h1 {
  font-size: 2.5rem;
}

h2 {
  font-size: 2rem;
  color: var(--primary-color);
  border-bottom: 2px solid var(--accent-color);
  padding-bottom: 0.5rem;
  margin-top: 2rem;
}

section {
  padding: 3rem 0;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}

.skill-tag {
  background-color: var(--secondary-color);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.project-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.project-card:hover {
  transform: translateY(-5px);
}

.project-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.project-content {
  padding: 1.5rem;
}

.project-techs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.project-techs span {
  background-color: #f1f5f9;
  color: #64748b;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.education-item, .experience-item {
  margin-bottom: 2rem;
}

.duration {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.contact {
  background-color: #f8fafc;
  padding: 3rem 0;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.social-links {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.social-link {
  color: var(--primary-color);
  font-size: 1.5rem;
}

footer {
  background-color: var(--primary-color);
  color: white;
  text-align: center;
  padding: 2rem 0;
  margin-top: 3rem;
}

/* Responsive styles */
@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    text-align: center;
  }
  
  .hero-content {
    margin-left: 0;
    margin-top: 1.5rem;
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
  }
}
  `;
}

/**
 * Generates basic JavaScript for the portfolio
 */
export function generateJs(): string {
  return `
// Simple script to handle navigation highlighting and smooth scrolling
document.addEventListener('DOMContentLoaded', function() {
  // Smooth scrolling for anchor links
  const links = document.querySelectorAll('nav a');
  
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 70,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Add active class to nav links on scroll
  function highlightNav() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');
    
    let currentSection = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.clientHeight;
      
      if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
        currentSection = '#' + section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === currentSection) {
        link.classList.add('active');
      }
    });
  }
  
  window.addEventListener('scroll', highlightNav);
});
  `;
}

/**
 * Generates a README file for the portfolio
 */
function generateReadme(portfolio: PortfolioFormData, templateName: string): string {
  return `# ${portfolio.name || 'My Developer Portfolio'}

This portfolio website was generated using Technest, a portfolio builder for developers.

## About This Portfolio

- **Name:** ${portfolio.personalInfo.firstName} ${portfolio.personalInfo.lastName}
- **Template Used:** ${templateName}
- **Generated On:** ${new Date().toLocaleDateString()}

## How to Use

1. **Local Viewing**: Open the \`index.html\` file in any web browser to view your portfolio locally.
2. **Customization**: You can edit the HTML, CSS, and JS files to further customize your portfolio.
3. **Hosting**: You can upload these files to any web hosting service to publish your portfolio online.

## Hosting Options

Here are some free hosting options for your portfolio:

- GitHub Pages (https://pages.github.com/)
- Netlify (https://www.netlify.com/)
- Vercel (https://vercel.com/)
- Render (https://render.com/)

## Additional Customization

The portfolio uses basic HTML, CSS, and JavaScript, making it easy to customize:

- Edit \`index.html\` to change content
- Modify \`css/styles.css\` to change styling
- Update \`js/main.js\` to add more interactivity

---

Generated with ❤️ by [Technest](https://technest.dev)
`;
}

/**
 * Sanitizes a filename to make it safe for saving
 */
function cleanFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
