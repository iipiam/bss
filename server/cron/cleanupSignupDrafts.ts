import cron from 'node-cron';
import { db } from '../db';
import { signupDrafts } from '../../shared/schema';
import { sql } from 'drizzle-orm';

export async function cleanupExpiredDrafts(): Promise<number> {
  // Delete drafts older than 24 hours
  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const result = await db
    .delete(signupDrafts)
    .where(sql`${signupDrafts.createdAt} < ${cutoffTime}`)
    .returning({ id: signupDrafts.id });
  
  return result.length;
}

export function scheduleSignupDraftCleanup() {
  // Run every hour: 0 * * * * (at minute 0 of every hour)
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[CRON] Starting signup draft cleanup...');
      
      const deletedCount = await cleanupExpiredDrafts();
      
      if (deletedCount > 0) {
        console.log(`[CRON] Deleted ${deletedCount} expired signup draft(s)`);
      } else {
        console.log('[CRON] No expired signup drafts found');
      }
    } catch (error) {
      console.error('[CRON] Signup draft cleanup error:', error);
    }
  });
  
  console.log('[CRON] Signup draft cleanup scheduled (runs every hour)');
}
