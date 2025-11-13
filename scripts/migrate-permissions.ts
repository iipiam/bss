import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_EMPLOYEE_PERMISSIONS, type PermissionSet } from "../shared/permissions";

async function migratePermissions() {
  console.log("Starting permissions migration...");
  
  try {
    const allUsers = await db.select().from(users).where(eq(users.role, "employee"));
    
    console.log(`Found ${allUsers.length} employee accounts to migrate`);
    
    let migratedCount = 0;
    
    for (const user of allUsers) {
      const oldPermissions = user.permissions as any;
      
      const newPermissions: PermissionSet = { ...DEFAULT_EMPLOYEE_PERMISSIONS };
      
      if (oldPermissions && typeof oldPermissions === 'object') {
        for (const [key, value] of Object.entries(oldPermissions)) {
          if (key in newPermissions && typeof value === 'boolean') {
            newPermissions[key as keyof PermissionSet] = value;
          }
        }
      }
      
      await db.update(users)
        .set({ permissions: newPermissions })
        .where(eq(users.id, user.id));
      
      migratedCount++;
      console.log(`✓ Migrated permissions for user: ${user.username} (${user.id})`);
    }
    
    console.log(`\n✅ Successfully migrated ${migratedCount} employee accounts`);
    console.log("\nMigration complete!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migratePermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
