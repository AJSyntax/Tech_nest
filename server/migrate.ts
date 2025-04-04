import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { seed } from './seed';

async function migrate() {
  try {
    const db = new Database('database.sqlite');
    const migrationSQL = fs.readFileSync(
      path.join(process.cwd(), 'migrations', '0000_initial.sql'),
      'utf-8'
    );

    // Execute migration
    db.exec(migrationSQL);
    console.log('✅ Migration completed successfully');

    // Run seeder
    await seed();
    
    db.close();
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

migrate();