import { db } from "../db";
import { 
  restaurants, users, branches, settings, inventoryItems, recipes, menuItems,
  orders, transactions, procurement, customers, deliveryApps, invoices,
  supportTickets, shopBills, salaries, inventoryTransactions, addons
} from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";

/**
 * Seed Default Restaurant Migration Script
 * 
 * This script:
 * 1. Creates the initial default restaurant for the multi-tenant system
 * 2. Migrates any existing data (with NULL restaurantId) to the default restaurant
 * 3. Can be run multiple times safely (idempotent)
 * 
 * Usage: tsx server/scripts/seedDefaultRestaurant.ts
 * 
 * NOTE: After the db:push --force in Task 2a, the database was wiped clean.
 * The backfill logic below is defensive programming for future scenarios.
 */

async function seedDefaultRestaurant() {
  console.log("🌱 Starting default restaurant seed migration...");
  let exitCode = 0;

  try {
    // Check if default restaurant already exists by unique identifiers
    let restaurant: any;
    const [existingRestaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.commercialRegistration, "1010123456"))
      .limit(1);
    
    if (existingRestaurant) {
      console.log("✅ Default restaurant already exists, using existing ID for backfill.");
      console.log(`   Restaurant: ${existingRestaurant.name}`);
      console.log(`   ID: ${existingRestaurant.id}`);
      restaurant = existingRestaurant;
    } else {
      console.log("📝 Creating default restaurant...");

      // Create default restaurant
      const [newRestaurant] = await db.insert(restaurants).values({
        name: "مطعم الكنزهال - Al-Kinzhal Restaurant",
        commercialRegistration: "1010123456",
        nationalId: "7000123456",
        taxNumber: "300123456700003",
        restaurantType: "Restaurant",
        subscriptionPlan: "monthly",
        subscriptionStatus: "active",
        branchesCount: 1,
        billingEmail: "admin@saudikinzhal.org",
        phone: "+966501234567",
        address: "King Fahd Road, Riyadh 12345, Saudi Arabia",
        settings: {
          language: "ar",
          currency: "SAR",
          timezone: "Asia/Riyadh",
          theme: "light"
        },
        active: true,
      }).returning();
      restaurant = newRestaurant;

      console.log(`✅ Restaurant created: ${restaurant.name}`);
      console.log(`   ID: ${restaurant.id}`);
    }

    // Create default branch (if not exists)
    let branch: any;
    const [existingBranch] = await db
      .select()
      .from(branches)
      .where(and(
        eq(branches.restaurantId, restaurant.id),
        eq(branches.name, "Main Branch - الفرع الرئيسي")
      ))
      .limit(1);

    if (existingBranch) {
      console.log("✅ Default branch already exists");
      branch = existingBranch;
    } else {
      console.log("📝 Creating default branch...");
      const [newBranch] = await db.insert(branches).values({
        restaurantId: restaurant.id,
        name: "Main Branch - الفرع الرئيسي",
        location: "King Fahd Road, Riyadh 12345",
        phone: "+966501234567",
        manager: "System Administrator",
        staff: 5,
        status: "Active",
      }).returning();
      branch = newBranch;

      console.log(`✅ Branch created: ${branch.name}`);
      console.log(`   ID: ${branch.id}`);
    }

    // Create admin user with hashed password (if not exists)
    let adminUser: any;
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.restaurantId, restaurant.id),
        eq(users.username, "admin")
      ))
      .limit(1);

    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      adminUser = existingAdmin;
    } else {
      console.log("📝 Creating admin user...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      
      const [newAdmin] = await db.insert(users).values({
        restaurantId: restaurant.id,
        username: "admin",
        password: hashedPassword,
        fullName: "System Administrator",
        email: "admin@saudikinzhal.org",
        phone: "+966501234567",
        role: "admin",
        permissions: {
          dashboard: true,
          inventory: true,
          menu: true,
          recipes: true,
          branches: true,
          procurement: true,
          pos: true,
          orders: true,
          kitchen: true,
          sales: true,
          reports: true,
          forecasting: true,
          analysis: true,
          settings: true,
          financial: true,
          employees: true,
        },
        branchId: branch.id,
        active: true,
      }).returning();
      adminUser = newAdmin;

      console.log(`✅ Admin user created: ${adminUser.username}`);
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Password: admin123 (change after first login)`);
    }

    // Create settings (if not exists)
    const [existingSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.restaurantId, restaurant.id))
      .limit(1);

    if (existingSettings) {
      console.log("✅ Settings already exist");
    } else {
      console.log("📝 Creating restaurant settings...");
      await db.insert(settings).values({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        vatNumber: restaurant.taxNumber,
        address: restaurant.address,
        email: restaurant.billingEmail,
        phone: restaurant.phone,
        language: "English",
        openingTime: "08:00",
        closingTime: "23:00",
      });

      console.log("✅ Settings created");
    }

    // Migrate any existing data with NULL restaurantId to default restaurant
    console.log("\n📝 Migrating existing data with NULL restaurantId...");
    
    // NOTE: After db:push --force in Task 2a, database was wiped clean.
    // This backfill logic ensures any orphaned data gets assigned to default restaurant.
    
    let totalMigrated = 0;
    
    // Backfill all tables with restaurantId
    const tablesToMigrate = [
      { name: "branches", table: branches },
      { name: "users", table: users },
      { name: "inventory_items", table: inventoryItems },
      { name: "recipes", table: recipes },
      { name: "menu_items", table: menuItems },
      { name: "addons", table: addons },
      { name: "orders", table: orders },
      { name: "inventory_transactions", table: inventoryTransactions },
      { name: "transactions", table: transactions },
      { name: "settings", table: settings },
      { name: "procurement", table: procurement },
      { name: "customers", table: customers },
      { name: "delivery_apps", table: deliveryApps },
      { name: "invoices", table: invoices },
      { name: "support_tickets", table: supportTickets },
      { name: "shop_bills", table: shopBills },
      { name: "salaries", table: salaries },
    ];
    
    for (const { name, table } of tablesToMigrate) {
      try {
        const orphanedRecords = await db
          .select()
          .from(table)
          .where(isNull((table as any).restaurantId));
        
        if (orphanedRecords.length > 0) {
          await db
            .update(table)
            .set({ restaurantId: restaurant.id } as any)
            .where(isNull((table as any).restaurantId));
          
          console.log(`   ✅ Migrated ${orphanedRecords.length} ${name} records`);
          totalMigrated += orphanedRecords.length;
        }
      } catch (error) {
        // Table might not exist or have restaurantId column - skip silently
        console.log(`   ⏭️  Skipped ${name} (not applicable)`);
      }
    }
    
    if (totalMigrated === 0) {
      console.log("   ✅ No orphaned data found (database was fresh after migration)");
    } else {
      console.log(`   ✅ Total records migrated: ${totalMigrated}`);
    }

    // Summary
    console.log("\n🎉 Default restaurant seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Restaurant: ${restaurant.name}`);
    console.log(`   Restaurant ID: ${restaurant.id}`);
    console.log(`   Branch: ${branch.name}`);
    console.log(`   Admin Username: ${adminUser.username}`);
    console.log(`   Admin Password: admin123`);
    console.log(`   Email: ${restaurant.billingEmail}`);
    console.log("\n⚠️  IMPORTANT: Change the admin password after first login!");

  } catch (error) {
    console.error("❌ Error during seed migration:", error);
    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
}

// Run the migration
seedDefaultRestaurant();
