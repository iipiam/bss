import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_EMPLOYEE_PERMISSIONS, ADMIN_PERMISSIONS, ALL_PERMISSIONS } from "../shared/permissions";

const DRY_RUN = process.env.DRY_RUN === 'true';

async function migratePermissions() {
  console.log(`\n🔄 Starting permission migration${DRY_RUN ? ' (DRY RUN)' : ''}...\n`);

  try {
    const allUsers = await db.select().from(users);
    console.log(`📊 Found ${allUsers.length} users to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of allUsers) {
      const oldPerms = user.permissions as any;
      
      // Build new permission set
      const newPerms = user.role === 'admin' 
        ? { ...ADMIN_PERMISSIONS }
        : {
            // Start with employee defaults
            ...DEFAULT_EMPLOYEE_PERMISSIONS,
            
            // Preserve existing permissions from old structure
            dashboard: oldPerms.dashboard ?? DEFAULT_EMPLOYEE_PERMISSIONS.dashboard,
            inventory: oldPerms.inventory ?? DEFAULT_EMPLOYEE_PERMISSIONS.inventory,
            menu: oldPerms.menu ?? DEFAULT_EMPLOYEE_PERMISSIONS.menu,
            recipes: oldPerms.recipes ?? DEFAULT_EMPLOYEE_PERMISSIONS.recipes,
            branches: oldPerms.branches ?? DEFAULT_EMPLOYEE_PERMISSIONS.branches,
            procurement: oldPerms.procurement ?? DEFAULT_EMPLOYEE_PERMISSIONS.procurement,
            pos: oldPerms.pos ?? DEFAULT_EMPLOYEE_PERMISSIONS.pos,
            orders: oldPerms.orders ?? DEFAULT_EMPLOYEE_PERMISSIONS.orders,
            kitchen: oldPerms.kitchen ?? DEFAULT_EMPLOYEE_PERMISSIONS.kitchen,
            sales: oldPerms.sales ?? DEFAULT_EMPLOYEE_PERMISSIONS.sales,
            reports: oldPerms.reports ?? DEFAULT_EMPLOYEE_PERMISSIONS.reports,
            customers: oldPerms.customers ?? DEFAULT_EMPLOYEE_PERMISSIONS.customers,
            settings: oldPerms.settings ?? DEFAULT_EMPLOYEE_PERMISSIONS.settings,
            
            // Map old "employees" to new "users"
            users: oldPerms.employees ?? oldPerms.users ?? DEFAULT_EMPLOYEE_PERMISSIONS.users,
            
            // New permissions default to employee defaults
            workingHours: oldPerms.workingHours ?? DEFAULT_EMPLOYEE_PERMISSIONS.workingHours,
            bills: oldPerms.bills ?? DEFAULT_EMPLOYEE_PERMISSIONS.bills,
            deliveryApps: oldPerms.deliveryApps ?? DEFAULT_EMPLOYEE_PERMISSIONS.deliveryApps,
          };

      // Verify all permissions are present
      const missingKeys = ALL_PERMISSIONS.filter(key => !(key in newPerms));
      if (missingKeys.length > 0) {
        console.error(`❌ Missing permissions for user ${user.id}: ${missingKeys.join(', ')}`);
        continue;
      }

      // Check if update is needed
      const needsUpdate = JSON.stringify(oldPerms) !== JSON.stringify(newPerms);
      
      if (needsUpdate) {
        console.log(`📝 User: ${user.fullName} (${user.username}) - Role: ${user.role}`);
        console.log(`   Old keys: ${Object.keys(oldPerms).sort().join(', ')}`);
        console.log(`   New keys: ${Object.keys(newPerms).sort().join(', ')}`);
        
        // Show permission changes
        const removedKeys = Object.keys(oldPerms).filter(k => !(k in newPerms));
        const addedKeys = Object.keys(newPerms).filter(k => !(k in oldPerms));
        const renamedKeys = oldPerms.employees !== undefined && newPerms.users !== undefined ? ['employees→users'] : [];
        
        if (removedKeys.length > 0) console.log(`   ❌ Removed: ${removedKeys.join(', ')}`);
        if (addedKeys.length > 0) console.log(`   ✅ Added: ${addedKeys.join(', ')}`);
        if (renamedKeys.length > 0) console.log(`   🔄 Renamed: ${renamedKeys.join(', ')}`);
        console.log('');

        if (!DRY_RUN) {
          await db.update(users)
            .set({ permissions: newPerms })
            .where(eq(users.id, user.id));
        }
        
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated: ${updatedCount} users`);
    console.log(`   Skipped: ${skippedCount} users (already normalized)`);
    
    if (DRY_RUN) {
      console.log(`\n⚠️  This was a DRY RUN. Run without DRY_RUN=true to apply changes.`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migratePermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
