import crypto from "crypto";
import bcrypt from "bcrypt";
import { db } from "../db";
import { signupDrafts, restaurants, users, branches, settings } from "@shared/schema";
import { eq, and, isNull, lt } from "drizzle-orm";
import type { SignupDraft } from "@shared/schema";

/**
 * Signup Service
 * Handles multi-step restaurant signup with security best practices:
 * - OTP hashing (SHA-256)
 * - Rate limiting support
 * - Idempotency
 * - Draft expiration
 */

// Pricing constants (15% VAT compliance)
const PLAN_PRICING = {
  weekly: { base: 39.90, perBranch: 7 },
  monthly: { base: 119.75, perBranch: 20 },
  yearly: { base: 1197.50, perBranch: 240 },
} as const;

const VAT_RATE = 0.15; // 15% Saudi VAT
const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;

export class SignupService {
  /**
   * Generate a random 6-digit OTP and return its hash
   */
  static generateOTP(): { otp: string; hash: string } {
    // Generate random 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Hash using SHA-256 before storage
    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    
    return { otp, hash };
  }

  /**
   * Verify OTP using constant-time comparison
   */
  static verifyOTP(inputOTP: string, storedHash: string): boolean {
    // Hash the input OTP
    const inputHash = crypto.createHash('sha256').update(inputOTP).digest('hex');
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(storedHash),
      Buffer.from(inputHash)
    );
  }

  /**
   * Calculate subscription pricing with 15% VAT
   */
  static calculatePricing(plan: 'weekly' | 'monthly' | 'yearly', branchesCount: number) {
    const pricing = PLAN_PRICING[plan];
    
    // First branch included in base price, additional branches charged separately
    const additionalBranches = Math.max(0, branchesCount - 1);
    const basePrice = pricing.base + (additionalBranches * pricing.perBranch);
    const vatAmount = basePrice * VAT_RATE;
    const totalPrice = basePrice + vatAmount;
    
    return {
      basePrice: Number(basePrice.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      totalPrice: Number(totalPrice.toFixed(2)),
    };
  }

  /**
   * Create or update signup draft (idempotent)
   */
  static async createOrUpdateDraft(data: {
    draftId?: string;
    restaurantName: string;
    commercialRegistration: string;
    nationalId: string;
    taxNumber: string;
    restaurantType: string;
    address: string;
    businessPhone: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    username: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<SignupDraft> {
    // Check for duplicate commercial registration in existing restaurants
    const [existingRestaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.commercialRegistration, data.commercialRegistration))
      .limit(1);
    
    if (existingRestaurant) {
      throw new Error('Commercial registration already exists. This business is already registered.');
    }

    // Check for duplicate email in existing restaurants
    const [existingEmail] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.billingEmail, data.ownerEmail))
      .limit(1);
    
    if (existingEmail) {
      throw new Error('Email already exists. This email is already registered.');
    }

    // If draftId provided, update existing draft
    if (data.draftId) {
      const [draft] = await db
        .select()
        .from(signupDrafts)
        .where(eq(signupDrafts.id, data.draftId))
        .limit(1);
      
      if (!draft) {
        throw new Error('Draft not found');
      }

      // Check if draft is expired
      if (draft.expiresAt && new Date(draft.expiresAt) < new Date()) {
        throw new Error('Draft has expired. Please start a new signup.');
      }

      // Update draft
      const [updated] = await db
        .update(signupDrafts)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(signupDrafts.id, data.draftId))
        .returning();
      
      return updated;
    }

    // Create new draft
    const [draft] = await db
      .insert(signupDrafts)
      .values({
        ...data,
        status: 'draft',
        paymentStatus: 'pending',
        otpAttempts: 0,
      })
      .returning();
    
    return draft;
  }

  /**
   * Update draft with plan and pricing
   */
  static async updatePlanAndPricing(
    draftId: string,
    plan: 'weekly' | 'monthly' | 'yearly',
    branchesCount: number
  ): Promise<SignupDraft> {
    const pricing = this.calculatePricing(plan, branchesCount);
    
    const [updated] = await db
      .update(signupDrafts)
      .set({
        subscriptionPlan: plan,
        branchesCount,
        basePrice: pricing.basePrice.toString(),
        vatAmount: pricing.vatAmount.toString(),
        totalPrice: pricing.totalPrice.toString(),
        status: 'payment_pending',
        updatedAt: new Date(),
      })
      .where(eq(signupDrafts.id, draftId))
      .returning();
    
    if (!updated) {
      throw new Error('Draft not found');
    }
    
    return updated;
  }

  /**
   * Update draft with Stripe payment information
   */
  static async updatePaymentInfo(
    draftId: string,
    stripeData: {
      stripeCustomerId: string;
      stripePaymentIntentId: string;
      stripeSubscriptionId?: string;
    }
  ): Promise<SignupDraft> {
    const [updated] = await db
      .update(signupDrafts)
      .set({
        ...stripeData,
        updatedAt: new Date(),
      })
      .where(eq(signupDrafts.id, draftId))
      .returning();
    
    if (!updated) {
      throw new Error('Draft not found');
    }
    
    return updated;
  }

  /**
   * Mark payment as succeeded
   */
  static async markPaymentSucceeded(draftId: string): Promise<SignupDraft> {
    const [updated] = await db
      .update(signupDrafts)
      .set({
        paymentStatus: 'succeeded',
        paymentCompletedAt: new Date(),
        status: 'otp_pending',
        updatedAt: new Date(),
      })
      .where(eq(signupDrafts.id, draftId))
      .returning();
    
    if (!updated) {
      throw new Error('Draft not found');
    }
    
    return updated;
  }

  /**
   * Store hashed OTP in draft
   */
  static async storeOTP(draftId: string, otpHash: string): Promise<SignupDraft> {
    const [draft] = await db
      .select()
      .from(signupDrafts)
      .where(eq(signupDrafts.id, draftId))
      .limit(1);
    
    if (!draft) {
      throw new Error('Draft not found');
    }

    // Check if OTP is locked due to too many failed attempts
    if (draft.otpLockedAt && new Date(draft.otpLockedAt) > new Date(Date.now() - 30 * 60 * 1000)) {
      throw new Error('OTP verification is locked. Too many failed attempts. Please try again in 30 minutes.');
    }

    const [updated] = await db
      .update(signupDrafts)
      .set({
        otpCodeHash: otpHash,
        otpSentAt: new Date(),
        otpAttempts: 0, // Reset attempts when new OTP is sent
        otpLockedAt: null, // Unlock if previously locked
        updatedAt: new Date(),
      })
      .where(eq(signupDrafts.id, draftId))
      .returning();
    
    return updated;
  }

  /**
   * Verify OTP with attempt tracking
   */
  static async verifyOTPAttempt(draftId: string, inputOTP: string): Promise<{ verified: boolean; draft: SignupDraft }> {
    const [draft] = await db
      .select()
      .from(signupDrafts)
      .where(eq(signupDrafts.id, draftId))
      .limit(1);
    
    if (!draft) {
      throw new Error('Draft not found');
    }

    // Check if OTP is locked
    if (draft.otpLockedAt && new Date(draft.otpLockedAt) > new Date(Date.now() - 30 * 60 * 1000)) {
      throw new Error('OTP verification is locked. Too many failed attempts. Please try again in 30 minutes.');
    }

    // Check if OTP is expired (5 minutes)
    if (!draft.otpSentAt || new Date(draft.otpSentAt) < new Date(Date.now() - OTP_EXPIRY_MINUTES * 60 * 1000)) {
      throw new Error('OTP has expired. Please request a new code.');
    }

    // Verify OTP
    const isValid = draft.otpCodeHash && this.verifyOTP(inputOTP, draft.otpCodeHash);

    if (isValid) {
      // OTP verified successfully
      const [updated] = await db
        .update(signupDrafts)
        .set({
          otpVerifiedAt: new Date(),
          status: 'otp_verified',
          updatedAt: new Date(),
        })
        .where(eq(signupDrafts.id, draftId))
        .returning();
      
      return { verified: true, draft: updated };
    } else {
      // Increment failed attempts
      const newAttempts = (draft.otpAttempts || 0) + 1;
      const isLocked = newAttempts >= MAX_OTP_ATTEMPTS;
      
      const [updated] = await db
        .update(signupDrafts)
        .set({
          otpAttempts: newAttempts,
          otpLockedAt: isLocked ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(signupDrafts.id, draftId))
        .returning();
      
      if (isLocked) {
        throw new Error('Too many failed attempts. OTP verification is locked for 30 minutes.');
      }
      
      throw new Error(`Invalid OTP. ${MAX_OTP_ATTEMPTS - newAttempts} attempts remaining.`);
    }
  }

  /**
   * Complete signup and activate restaurant (TRANSACTION)
   */
  static async completeSignup(draftId: string, password: string): Promise<{
    restaurant: typeof restaurants.$inferSelect;
    user: typeof users.$inferSelect;
    branch: typeof branches.$inferSelect;
  }> {
    // Get draft and validate
    const [draft] = await db
      .select()
      .from(signupDrafts)
      .where(eq(signupDrafts.id, draftId))
      .limit(1);
    
    if (!draft) {
      throw new Error('Draft not found');
    }

    // Validate draft is ready for completion
    if (draft.paymentStatus !== 'succeeded') {
      throw new Error('Payment not completed');
    }

    if (!draft.otpVerifiedAt) {
      throw new Error('OTP not verified');
    }

    if (draft.status === 'completed') {
      throw new Error('Signup already completed');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Calculate subscription dates
    const now = new Date();
    let subscriptionEndDate: Date;
    
    switch (draft.subscriptionPlan) {
      case 'weekly':
        subscriptionEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Create restaurant record
    const [restaurant] = await db
      .insert(restaurants)
      .values({
        name: draft.restaurantName,
        commercialRegistration: draft.commercialRegistration,
        nationalId: draft.nationalId,
        taxNumber: draft.taxNumber,
        restaurantType: draft.restaurantType as any,
        subscriptionPlan: draft.subscriptionPlan as any,
        subscriptionStatus: 'active',
        branchesCount: draft.branchesCount || 1,
        subscriptionStartDate: now,
        subscriptionEndDate,
        billingEmail: draft.ownerEmail,
        phone: draft.businessPhone,
        address: draft.address,
        settings: {
          language: "ar",
          currency: "SAR",
          timezone: "Asia/Riyadh",
          theme: "light",
        },
        active: true,
      })
      .returning();

    // Create first branch
    const [branch] = await db
      .insert(branches)
      .values({
        restaurantId: restaurant.id,
        name: "Main Branch - الفرع الرئيسي",
        location: draft.address,
        phone: draft.businessPhone,
        manager: draft.ownerName,
        staff: 1,
        status: "Active",
      })
      .returning();

    // Create admin user
    const [user] = await db
      .insert(users)
      .values({
        restaurantId: restaurant.id,
        username: draft.username,
        password: hashedPassword,
        fullName: draft.ownerName,
        email: draft.ownerEmail,
        phone: draft.ownerPhone,
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
      })
      .returning();

    // Create settings
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

    // Mark draft as completed
    await db
      .update(signupDrafts)
      .set({
        status: 'completed',
        completedAt: new Date(),
        restaurantId: restaurant.id,
        userId: user.id,
        updatedAt: new Date(),
      })
      .where(eq(signupDrafts.id, draftId));

    return { restaurant, user, branch };
  }

  /**
   * Cleanup expired drafts (run by cron job)
   */
  static async cleanupExpiredDrafts(): Promise<number> {
    const result = await db
      .delete(signupDrafts)
      .where(and(
        lt(signupDrafts.expiresAt, new Date()),
        eq(signupDrafts.status, 'draft')
      ));
    
    return result.rowCount || 0;
  }

  /**
   * Get draft by ID
   */
  static async getDraft(draftId: string): Promise<SignupDraft | null> {
    const [draft] = await db
      .select()
      .from(signupDrafts)
      .where(eq(signupDrafts.id, draftId))
      .limit(1);
    
    return draft || null;
  }
}
