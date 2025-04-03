import { PortfolioFormData } from '@/types/portfolio';

/**
 * Generates the complete HTML for the portfolio website
 * @param portfolio The portfolio data to include in the HTML
 * @param templateName The name of the template used
 * @returns Complete HTML content as a string
 */
export function generateHtml(portfolio: PortfolioFormData, templateName: string): string {
  const { personalInfo, skills, projects, education, colorScheme } = portfolio;
  
  const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || 'Developer Name';
  const profilePhotoUrl = personalInfo.profilePhotoUrl || 'https://via.placeholder.com/150';
  
  // Generate skill tags HTML
  const skillsHtml = skills.map(skill => {
    return `<span class="skill-tag" title="${skill.name} - ${skill.proficiency}/5">${skill.name}</span>`;
  }).join('\n      ');
  
  // Group skills by category
  const skillsByCategory = skills.reduce((acc: Record<string, typeof skills>, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {});
  
  // Generate projects HTML
  const projectsHtml = projects.map(project => {
    const techsHtml = project.technologies.map(tech => {
      return `<span>${tech}</span>`;
    }).join('\n          ');
    
    return `
      <div class="project-card">
        ${project.imageUrl ? `<img src="${project.imageUrl}" alt="${project.title}" class="project-image">` : ''}
        <div class="project-content">
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          <div class="project-techs">
          ${techsHtml}
          </div>
          <div class="project-links" style="margin-top: 1rem;">
            ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" style="color: var(--primary-color); margin-right: 1rem;">Live Demo</a>` : ''}
            ${project.codeUrl ? `<a href="${project.codeUrl}" target="_blank" style="color: var(--primary-color);">View Code</a>` : ''}
          </div>
        </div>
      </div>`;
  }).join('\n      ');
  
  // Generate education and experience items
  const educationItems = education.map(item => {
    // Try to determine if this is an education or experience entry
    const isEducation = !item.institution.includes(",") && 
                       !item.institution.includes("Inc") && 
                       !item.institution.includes("LLC");
    
    const sectionClass = isEducation ? 'education-item' : 'experience-item';
    
    return `
      <div class="${sectionClass}">
        <h3>${item.institution}</h3>
        <h4>${item.degree}</h4>
        <div class="duration">${item.startDate} - ${item.endDate || 'Present'}</div>
        <p>${item.description || ''}</p>
      </div>`;
  }).join('\n      ');
  
  // Generate social links
  const socialLinksHtml = (personalInfo.socialLinks || []).map(link => {
    // Determine icon based on platform name
    let iconClass = 'fas fa-link';
    if (link.platform.toLowerCase().includes('github')) iconClass = 'fab fa-github';
    if (link.platform.toLowerCase().includes('linked')) iconClass = 'fab fa-linkedin';
    if (link.platform.toLowerCase().includes('twitter')) iconClass = 'fab fa-twitter';
    if (link.platform.toLowerCase().includes('facebook')) iconClass = 'fab fa-facebook';
    if (link.platform.toLowerCase().includes('instagram')) iconClass = 'fab fa-instagram';
    
    return `<a href="${link.url}" target="_blank" class="social-link"><i class="${iconClass}"></i></a>`;
  }).join('\n        ');
  
  // Generate the full HTML document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullName} - ${personalInfo.headline || 'Developer Portfolio'}</title>
  <meta name="description" content="${personalInfo.about?.slice(0, 160) || 'Developer portfolio showcasing projects and skills'}">
  
  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Font Awesome for icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <!-- Custom styles -->
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header>
    <div class="container">
      <div class="hero">
        <img src="${profilePhotoUrl}" alt="${fullName}" class="hero-image">
        <div class="hero-content">
          <h1>${fullName}</h1>
          <p>${personalInfo.headline || 'Developer'}</p>
        </div>
      </div>
    </div>
    <nav>
      <div class="container">
        <ul>
          <li><a href="#about">About</a></li>
          <li><a href="#skills">Skills</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#education">Education & Experience</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </div>
    </nav>
  </header>
  
  <main>
    <section id="about" class="container">
      <h2>About Me</h2>
      <p>${personalInfo.about || 'No information provided.'}</p>
    </section>
    
    <section id="skills" class="container">
      <h2>Skills & Technologies</h2>
      ${Object.keys(skillsByCategory).length > 0 ? 
        Object.entries(skillsByCategory).map(([category, categorySkills]) => `
          <div style="margin-bottom: 2rem;">
            <h3>${category}</h3>
            <div class="skills-list">
              ${categorySkills.map(skill => `
                <span class="skill-tag" title="${skill.name} - ${skill.proficiency}/5">${skill.name}</span>
              `).join('')}
            </div>
          </div>
        `).join('') : 
        `<div class="skills-list">${skillsHtml || '<p>No skills listed yet.</p>'}</div>`
      }
    </section>
    
    <section id="projects" class="container">
      <h2>Projects</h2>
      <div class="projects-grid">
      ${projectsHtml || '<p>No projects listed yet.</p>'}
      </div>
    </section>
    
    <section id="education" class="container">
      <h2>Education & Experience</h2>
      ${educationItems || '<p>No education or experience listed yet.</p>'}
    </section>
    
    <section id="contact" class="contact">
      <div class="container">
        <h2>Contact Me</h2>
        <div class="contact-info">
          ${personalInfo.email ? `
          <div class="contact-item">
            <i class="fas fa-envelope" style="color: var(--primary-color);"></i>
            <a href="mailto:${personalInfo.email}" style="color: var(--text-color); text-decoration: none;">${personalInfo.email}</a>
          </div>
          ` : ''}
          
          ${personalInfo.phone ? `
          <div class="contact-item">
            <i class="fas fa-phone" style="color: var(--primary-color);"></i>
            <a href="tel:${personalInfo.phone}" style="color: var(--text-color); text-decoration: none;">${personalInfo.phone}</a>
          </div>
          ` : ''}
          
          ${personalInfo.socialLinks && personalInfo.socialLinks.length > 0 ? `
          <div class="social-links">
            ${socialLinksHtml}
          </div>
          ` : ''}
        </div>
      </div>
    </section>
  </main>
  
  <footer>
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} ${fullName}. All rights reserved.</p>
      <p style="margin-top: 0.5rem; font-size: 0.8rem;">Built with <a href="#" style="color: white;">Technest</a> using the ${templateName} template</p>
    </div>
  </footer>
  
  <script src="js/main.js"></script>
</body>
</html>`;
}
