import { db, pool } from '../server/db';
import { readFileSync } from 'fs';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🔄 Starting AWS RDS database migration...\n');
  
  try {
    // Check if tables already exist
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    const tableCount = Number(result.rows[0]?.count || 0);
    
    if (tableCount > 0) {
      console.log(`⚠️  Database already has ${tableCount} tables.`);
      
      // List existing tables
      const tables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      
      console.log('\n📊 Existing tables:');
      tables.rows.forEach((row: any) => console.log(`  - ${row.table_name}`));
      console.log('\n✅ Database schema already exists. No migration needed.');
    } else {
      // Execute migration SQL
      console.log('📋 Creating database schema from migrations/0000_legal_greymalkin.sql...\n');
      const migrationSQL = readFileSync('migrations/0000_legal_greymalkin.sql', 'utf8');
      
      await db.execute(sql.raw(migrationSQL));
      
      console.log('✅ Database schema created successfully!');
      
      // Verify tables were created
      const verification = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      
      console.log(`\n📊 Created ${verification.rows.length} tables:`);
      verification.rows.forEach((row: any) => console.log(`  - ${row.table_name}`));
    }
    
    await pool.end();
    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
