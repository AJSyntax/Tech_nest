import { db } from './db';
import { users, templates } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { hash } from 'bcrypt';

export async function seed() {
  try {
    // Check if admin user exists
    let adminUser = await db.select().from(users).where(sql`username = 'admin'`).get();
    
    if (!adminUser) {
      // Create admin user if doesn't exist
      const hashedPassword = await hash('admin123', 10);
      adminUser = await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      }).returning().get();
    }

    // Create some initial templates
    await db.insert(templates).values([
      {
        name: 'Modern Portfolio',
        description: 'A clean and modern portfolio template with minimalist design',
        thumbnailUrl: 'https://example.com/modern-portfolio.jpg',
        isPremium: false,
        category: 'Professional',
        htmlContent: '<div class="portfolio"><!-- Basic portfolio structure --></div>',
        cssContent: '.portfolio { /* Basic styles */ }',
        jsContent: '// Basic interactivity',
        createdBy: adminUser.id
      },
      {
        name: 'Creative Portfolio',
        description: 'A vibrant and creative portfolio template for artists and designers',
        thumbnailUrl: 'https://example.com/creative-portfolio.jpg',
        isPremium: true,
        price: 2999, // $29.99
        category: 'Creative',
        htmlContent: '<div class="creative-portfolio"><!-- Creative portfolio structure --></div>',
        cssContent: '.creative-portfolio { /* Creative styles */ }',
        jsContent: '// Creative interactions',
        createdBy: adminUser.id
      }
    ]);

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();