import { Router } from "express";
import { SignupService } from "../services/signupService";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

/**
 * Signup API Routes
 * Multi-step restaurant registration with Moyasar payment gateway
 */

// Step 1-2: Create/Update Draft (Company Info + Owner Details)
router.post("/draft", async (req, res) => {
  try {
    const schema = z.object({
      draftId: z.string().optional(),
      restaurantName: z.string().min(3),
      commercialRegistration: z.string().min(10),
      nationalId: z.string().min(10),
      taxNumber: z.string().min(15),
      restaurantType: z.enum(["Restaurant", "Cloud Kitchen", "Coffee Shop", "Tea Shop", "Sweets Shop"]),
      address: z.string().min(10),
      businessPhone: z.string().min(10),
      ownerName: z.string().min(3),
      ownerEmail: z.string().email(),
      ownerPhone: z.string().min(10),
      username: z.string().min(3),
    });

    const data = schema.parse(req.body);

    // Get IP address and user agent for tracking
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    const draft = await SignupService.createOrUpdateDraft({
      ...data,
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      draftId: draft.id,
      message: "Draft saved successfully",
    });
  } catch (error: any) {
    console.error("Signup draft error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to save draft",
    });
  }
});

// Step 3: Update Plan and Calculate Pricing
router.post("/plan", async (req, res) => {
  try {
    const schema = z.object({
      draftId: z.string(),
      plan: z.enum(["weekly", "monthly", "yearly"]),
      branchesCount: z.number().min(1),
    });

    const { draftId, plan, branchesCount } = schema.parse(req.body);

    // Calculate pricing
    const pricing = SignupService.calculatePricing(plan, branchesCount);

    // Update draft
    const draft = await SignupService.updatePlanAndPricing(draftId, plan, branchesCount);

    res.json({
      success: true,
      pricing,
      draft: {
        id: draft.id,
        plan: draft.subscriptionPlan,
        branchesCount: draft.branchesCount,
      },
    });
  } catch (error: any) {
    console.error("Plan selection error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update plan",
    });
  }
});

// Step 4: Create Moyasar Payment Intent
router.post("/payment-intent", async (req, res) => {
  try {
    const schema = z.object({
      draftId: z.string(),
    });

    const { draftId } = schema.parse(req.body);

    // Get draft
    const draft = await SignupService.getDraft(draftId);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Draft not found",
      });
    }

    // Verify plan is selected
    if (!draft.subscriptionPlan || !draft.totalPrice) {
      return res.status(400).json({
        success: false,
        message: "Please select a subscription plan first",
      });
    }

    // Check if Moyasar keys are configured
    if (!process.env.MOYASAR_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Payment gateway not configured. Please contact support.",
      });
    }

    // Create Moyasar payment using HTTP Basic Auth
    const amountInHalalas = Math.round(parseFloat(draft.totalPrice) * 100); // Convert SAR to Halalas
    
    const moyasarPayload = {
      amount: amountInHalalas,
      currency: "SAR",
      description: `RestoPOS Subscription - ${draft.restaurantName}`,
      callback_url: `${req.protocol}://${req.get('host')}/api/signup/payment-callback`,
      metadata: {
        draft_id: draftId,
        restaurant_name: draft.restaurantName,
        plan: draft.subscriptionPlan,
        branches: draft.branchesCount,
      },
    };

    // Call Moyasar API using fetch with Basic Auth
    const auth = Buffer.from(`${process.env.MOYASAR_SECRET_KEY}:`).toString('base64');
    
    const response = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(moyasarPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment intent');
    }

    const payment = await response.json();

    // Store payment information in draft
    await SignupService.updatePaymentInfo(draftId, {
      stripeCustomerId: payment.id, // Using as payment ID reference
      stripePaymentIntentId: payment.id,
      stripeSubscriptionId: payment.id,
    });

    res.json({
      success: true,
      paymentId: payment.id,
      amount: draft.totalPrice,
      currency: "SAR",
      // For frontend integration
      publishableKey: process.env.VITE_MOYASAR_PUBLIC_KEY,
    });
  } catch (error: any) {
    console.error("Payment intent error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment intent",
    });
  }
});

// Step 4b: Payment Callback (Moyasar redirects here after payment)
router.get("/payment-callback", async (req, res) => {
  try {
    const paymentId = req.query.id as string;

    if (!paymentId) {
      return res.redirect('/signup?error=payment_failed');
    }

    // Fetch payment from Moyasar to verify
    const auth = Buffer.from(`${process.env.MOYASAR_SECRET_KEY}:`).toString('base64');
    
    const response = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      return res.redirect('/signup?error=payment_verification_failed');
    }

    const payment = await response.json();

    // Find draft by payment ID
    const draftId = payment.metadata?.draft_id;
    if (!draftId) {
      return res.redirect('/signup?error=draft_not_found');
    }

    // Check payment status
    if (payment.status === 'paid') {
      // Mark payment as succeeded
      await SignupService.markPaymentSucceeded(draftId);
      
      // Redirect to OTP verification step
      return res.redirect(`/signup?step=5&draftId=${draftId}&payment=success`);
    } else {
      // Payment failed
      return res.redirect(`/signup?step=4&draftId=${draftId}&payment=failed`);
    }
  } catch (error: any) {
    console.error("Payment callback error:", error);
    res.redirect('/signup?error=callback_failed');
  }
});

// Step 5a: Send OTP via SMS (will integrate Twilio later)
router.post("/send-otp", async (req, res) => {
  try {
    const schema = z.object({
      draftId: z.string(),
    });

    const { draftId } = schema.parse(req.body);

    // Get draft
    const draft = await SignupService.getDraft(draftId);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Draft not found",
      });
    }

    // Verify payment is completed
    if (draft.paymentStatus !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: "Payment not completed. Please complete payment first.",
      });
    }

    // Generate OTP
    const { otp, hash } = SignupService.generateOTP();

    // Store hashed OTP
    await SignupService.storeOTP(draftId, hash);

    // TODO: Send OTP via Twilio SMS (Task 9)
    // For now, log it (development only - remove in production)
    console.log(`[DEV] OTP for ${draft.ownerPhone}: ${otp}`);

    res.json({
      success: true,
      message: "OTP sent successfully",
      // TODO: Remove this in production - only for development testing
      devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
});

// Step 5b: Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const schema = z.object({
      draftId: z.string(),
      otp: z.string().length(6),
    });

    const { draftId, otp } = schema.parse(req.body);

    // Verify OTP
    const { verified, draft } = await SignupService.verifyOTPAttempt(draftId, otp);

    if (verified) {
      res.json({
        success: true,
        message: "OTP verified successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "OTP verification failed",
    });
  }
});

// Step 6: Complete Signup (Final activation)
router.post("/complete", async (req, res) => {
  try {
    const schema = z.object({
      draftId: z.string(),
      password: z.string().min(8),
    });

    const { draftId, password } = schema.parse(req.body);

    // Complete signup (creates restaurant, branch, user)
    const { restaurant, user, branch } = await SignupService.completeSignup(draftId, password);

    // Auto-login the user using passport
    (req as any).login(user, (err: any) => {
      if (err) {
        console.error("Auto-login error:", err);
        return res.json({
          success: true,
          message: "Signup completed successfully. Please login.",
          restaurantId: restaurant.id,
          userId: user.id,
          autoLoginFailed: true,
        });
      }

      res.json({
        success: true,
        message: "Signup completed successfully!",
        restaurantId: restaurant.id,
        userId: user.id,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (error: any) {
    console.error("Complete signup error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to complete signup",
    });
  }
});

// Get draft status (for resuming signup)
router.get("/draft/:draftId", async (req, res) => {
  try {
    const { draftId } = req.params;

    const draft = await SignupService.getDraft(draftId);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Draft not found",
      });
    }

    // Don't expose sensitive data
    const safeDraft = {
      id: draft.id,
      restaurantName: draft.restaurantName,
      ownerName: draft.ownerName,
      ownerEmail: draft.ownerEmail,
      subscriptionPlan: draft.subscriptionPlan,
      branchesCount: draft.branchesCount,
      basePrice: draft.basePrice,
      vatAmount: draft.vatAmount,
      totalPrice: draft.totalPrice,
      status: draft.status,
      paymentStatus: draft.paymentStatus,
      otpVerified: !!draft.otpVerifiedAt,
      createdAt: draft.createdAt,
      expiresAt: draft.expiresAt,
    };

    res.json({
      success: true,
      draft: safeDraft,
    });
  } catch (error: any) {
    console.error("Get draft error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch draft",
    });
  }
});

export default router;
