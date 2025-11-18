/**
 * Password Reset Utility Script
 * Usage: tsx scripts/reset-password.ts <username> <new-password>
 */

import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function resetPassword(username: string, newPassword: string) {
  try {
    console.log(`Resetting password for user: ${username}`);
    
    // Find user
    const [user] = await db.select().from(users).where(eq(users.username, username));
    
    if (!user) {
      console.error(`❌ User '${username}' not found!`);
      process.exit(1);
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, username));
    
    console.log(`✅ Password successfully reset for '${username}'`);
    console.log(`New password: ${newPassword}`);
    process.exit(0);
  } catch (error) {
    console.error("Error resetting password:", error);
    process.exit(1);
  }
}

// Get command line arguments
const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
  console.error("Usage: tsx scripts/reset-password.ts <username> <new-password>");
  console.error("Example: tsx scripts/reset-password.ts test_admin MyNewPassword123");
  process.exit(1);
}

resetPassword(username, newPassword);