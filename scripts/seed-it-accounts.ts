import { db } from "../server/db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

const IT_PERMISSIONS = {
  pos: true,
  menu: true,
  bills: true,
  sales: true,
  users: true,
  orders: true,
  kitchen: true,
  recipes: true,
  reports: true,
  branches: true,
  licenses: true,
  settings: true,
  customers: true,
  dashboard: true,
  inventory: true,
  procurement: true,
  deliveryApps: true,
  workingHours: true,
};

async function seedITAccounts() {
  console.log("🌱 Seeding IT support accounts...");

  try {
    const itAccounts = [
      {
        username: "it_support",
        password: "IT@Support2024!",
        fullName: "IT Support Team",
        email: "support@saudikinzhal.org",
      },
      {
        username: "it@saudikinzhal.org",
        password: "IT@Admin2024!",
        fullName: "IT Administrator",
        email: "it@saudikinzhal.org",
      },
    ];

    for (const account of itAccounts) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, account.username))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`⏭️  Skipping ${account.username} - already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(account.password, 10);

      await db.insert(users).values({
        restaurantId: null,
        username: account.username,
        password: hashedPassword,
        fullName: account.fullName,
        email: account.email,
        role: "admin",
        permissions: IT_PERMISSIONS as any,
        active: true,
        devicePreference: "laptop",
      });

      console.log(`✅ Created IT account: ${account.username}`);
    }

    console.log("\n✅ IT accounts seeded successfully!");
    console.log("\n📋 IT Account Credentials:");
    console.log("   Username: it_support");
    console.log("   Password: IT@Support2024!");
    console.log("");
    console.log("   Username: it@saudikinzhal.org");
    console.log("   Password: IT@Admin2024!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding IT accounts:", error);
    process.exit(1);
  }
}

seedITAccounts();
