import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Check, Building2, User, CreditCard, Smartphone, Settings, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Step 1-2: Company Info + Owner Details combined
const companyAndOwnerSchema = z.object({
  restaurantName: z.string().min(3, "Restaurant name must be at least 3 characters"),
  commercialRegistration: z.string().min(10, "Commercial registration number is required"),
  nationalId: z.string().min(10, "National ID is required"),
  taxNumber: z.string().min(15, "VAT number must be 15 digits"),
  restaurantType: z.enum(["Restaurant", "Cloud Kitchen", "Coffee Shop", "Tea Shop", "Sweets Shop"]),
  address: z.string().min(10, "Full address is required"),
  businessPhone: z.string().min(10, "Phone number is required"),
  ownerName: z.string().min(3, "Owner name is required"),
  ownerEmail: z.string().email("Valid email is required"),
  ownerPhone: z.string().min(10, "Phone number is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

// Step 3: Plan Selection
const planSelectionSchema = z.object({
  plan: z.enum(["weekly", "monthly", "yearly"]),
  branchesCount: z.number().min(1, "At least 1 branch is required"),
});

// Step 6: Final password setup
const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CompanyAndOwner = z.infer<typeof companyAndOwnerSchema>;
type PlanSelection = z.infer<typeof planSelectionSchema>;
type PasswordSetup = z.infer<typeof passwordSchema>;

const PLAN_PRICING = {
  weekly: { base: 39.90, perBranch: 7 },
  monthly: { base: 119.75, perBranch: 20 },
  yearly: { base: 1197.50, perBranch: 240 },
};

export default function Signup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Check URL params for payment callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const urlDraftId = params.get('draftId');
    const stepParam = params.get('step');

    if (paymentStatus === 'success' && urlDraftId) {
      setDraftId(urlDraftId);
      setCurrentStep(5); // Move to OTP verification
      toast({
        title: "Payment Successful",
        description: "Please verify your phone number to continue",
      });
    } else if (paymentStatus === 'failed') {
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } else if (stepParam && urlDraftId) {
      setDraftId(urlDraftId);
      setCurrentStep(parseInt(stepParam));
    }
  }, []);

  const steps = [
    { number: 1, title: "Company Info", icon: Building2 },
    { number: 2, title: "Owner Details", icon: User },
    { number: 3, title: "Plan Selection", icon: Settings },
    { number: 4, title: "Payment", icon: CreditCard },
    { number: 5, title: "OTP Verification", icon: Smartphone },
    { number: 6, title: "Setup Complete", icon: Check },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep > step.number
                        ? "bg-green-500 text-white"
                        : currentStep === step.number
                        ? "bg-orange-500 text-white ring-4 ring-orange-200"
                        : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    }`}
                    data-testid={`step-indicator-${step.number}`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <p className={`mt-2 text-sm font-medium ${
                    currentStep >= step.number ? "text-gray-900 dark:text-white" : "text-gray-400"
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      currentStep > step.number ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              {currentStep === 1 && "Company Information"}
              {currentStep === 2 && "Owner Details"}
              {currentStep === 3 && "Choose Your Plan"}
              {currentStep === 4 && "Payment"}
              {currentStep === 5 && "Verify Your Phone"}
              {currentStep === 6 && "All Set!"}
            </CardTitle>
            <CardDescription className="text-center">
              {currentStep === 1 && "Tell us about your restaurant business"}
              {currentStep === 2 && "Create your admin account"}
              {currentStep === 3 && "Select the best plan for your needs"}
              {currentStep === 4 && "Secure payment powered by Moyasar (SAMA-licensed)"}
              {currentStep === 5 && "Enter the code sent to your phone"}
              {currentStep === 6 && "Your account is ready to use"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <CompanyInfoStep
                onNext={(id: string) => {
                  setDraftId(id);
                  setCurrentStep(2);
                }}
                draftId={draftId}
              />
            )}
            {currentStep === 2 && (
              <OwnerDetailsStep
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
                draftId={draftId!}
              />
            )}
            {currentStep === 3 && (
              <PlanSelectionStep
                onNext={(pricingData: any) => {
                  setPricing(pricingData);
                  setCurrentStep(4);
                }}
                onBack={() => setCurrentStep(2)}
                draftId={draftId!}
              />
            )}
            {currentStep === 4 && (
              <PaymentStep
                onNext={() => setCurrentStep(5)}
                onBack={() => setCurrentStep(3)}
                draftId={draftId!}
                pricing={pricing}
              />
            )}
            {currentStep === 5 && (
              <OTPVerificationStep
                onNext={() => setCurrentStep(6)}
                onBack={() => setCurrentStep(4)}
                draftId={draftId!}
                devOtp={devOtp}
                setDevOtp={setDevOtp}
              />
            )}
            {currentStep === 6 && (
              <SetupCompleteStep
                draftId={draftId!}
                onComplete={() => navigate("/")}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Step 1: Company Information
function CompanyInfoStep({ onNext, draftId }: { onNext: (id: string) => void; draftId: string | null }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CompanyAndOwner>({
    resolver: zodResolver(companyAndOwnerSchema),
    defaultValues: {},
  });

  const onSubmit = async (data: CompanyAndOwner) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/signup/draft", { ...data, draftId });
      const response = await res.json();

      if (response.success) {
        toast({
          title: "Progress Saved",
          description: "Company information saved successfully",
        });
        onNext(response.draftId);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save company information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="restaurantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restaurant Name (Arabic & English)</FormLabel>
              <FormControl>
                <Input placeholder="مطعم النخيل - Al-Nakheel Restaurant" {...field} data-testid="input-restaurant-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="commercialRegistration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commercial Registration No.</FormLabel>
                <FormControl>
                  <Input placeholder="1010123456" {...field} data-testid="input-commercial-reg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nationalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>National ID</FormLabel>
                <FormControl>
                  <Input placeholder="7000123456" {...field} data-testid="input-national-id" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="taxNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VAT Number (15 digits)</FormLabel>
                <FormControl>
                  <Input placeholder="300123456700003" {...field} data-testid="input-vat-number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="restaurantType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-restaurant-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                    <SelectItem value="Cloud Kitchen">Cloud Kitchen</SelectItem>
                    <SelectItem value="Coffee Shop">Coffee Shop</SelectItem>
                    <SelectItem value="Tea Shop">Tea Shop</SelectItem>
                    <SelectItem value="Sweets Shop">Sweets Shop</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Address</FormLabel>
              <FormControl>
                <Input placeholder="King Fahd Road, Riyadh 12345, Saudi Arabia" {...field} data-testid="input-address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Phone</FormLabel>
              <FormControl>
                <Input placeholder="+966501234567" {...field} data-testid="input-phone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Owner Details - Combined in Step 1 */}
        <div className="border-t pt-4 mt-6">
          <h3 className="text-lg font-semibold mb-4">Owner Details</h3>
          
          <FormField
            control={form.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Ahmed Al-Saud" {...field} data-testid="input-owner-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="ownerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ahmed@example.com" {...field} data-testid="input-owner-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+966501234567" {...field} data-testid="input-owner-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Username (for login)</FormLabel>
                <FormControl>
                  <Input placeholder="ahmed_admin" {...field} data-testid="input-username" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="w-full md:w-auto" disabled={isLoading} data-testid="button-next-step">
            {isLoading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
            Next <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Step 2: Owner Details (Hidden - merged with Step 1)
function OwnerDetailsStep({ onNext, onBack, draftId }: any) {
  // This step is now combined with Step 1
  // Automatically skip to next
  useEffect(() => {
    onNext();
  }, []);

  return null;
}

// Step 3: Plan Selection
function PlanSelectionStep({ onNext, onBack, draftId }: { onNext: (pricing: any) => void; onBack: () => void; draftId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PlanSelection>({
    resolver: zodResolver(planSelectionSchema),
    defaultValues: { plan: "monthly", branchesCount: 1 },
  });

  const watchPlan = form.watch("plan");
  const watchBranches = form.watch("branchesCount");

  const calculateTotal = () => {
    const pricing = PLAN_PRICING[watchPlan as keyof typeof PLAN_PRICING];
    const branchCost = Math.max(0, watchBranches - 1) * pricing.perBranch;
    const subtotal = pricing.base + branchCost;
    const vat = subtotal * 0.15;
    return { subtotal, vat, total: subtotal + vat };
  };

  const { subtotal, vat, total } = calculateTotal();

  const onSubmit = async (data: PlanSelection) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/signup/plan", { draftId, ...data });
      const response = await res.json();

      if (response.success) {
        toast({
          title: "Plan Selected",
          description: `${data.plan} plan with ${data.branchesCount} branch(es)`,
        });
        onNext(response.pricing);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save plan selection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Select Subscription Plan</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <Label
                    htmlFor="weekly"
                    className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer hover-elevate ${
                      field.value === "weekly" ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-gray-200"
                    }`}
                    data-testid="plan-weekly"
                  >
                    <RadioGroupItem value="weekly" id="weekly" className="sr-only" />
                    <div className="text-center">
                      <p className="text-2xl font-bold">39.90 SAR</p>
                      <p className="text-sm text-gray-500">per week</p>
                      <p className="text-xs text-gray-400 mt-2">+ 7 SAR per extra branch</p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="monthly"
                    className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer hover-elevate relative ${
                      field.value === "monthly" ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-gray-200"
                    }`}
                    data-testid="plan-monthly"
                  >
                    <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
                    <div className="absolute -top-3 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                      Popular
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">119.75 SAR</p>
                      <p className="text-sm text-gray-500">per month</p>
                      <p className="text-xs text-gray-400 mt-2">+ 20 SAR per extra branch</p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="yearly"
                    className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer hover-elevate relative ${
                      field.value === "yearly" ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-gray-200"
                    }`}
                    data-testid="plan-yearly"
                  >
                    <RadioGroupItem value="yearly" id="yearly" className="sr-only" />
                    <div className="absolute -top-3 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Save 17%
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">1,197.50 SAR</p>
                      <p className="text-sm text-gray-500">per year</p>
                      <p className="text-xs text-gray-400 mt-2">+ 240 SAR per extra branch</p>
                    </div>
                  </Label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="branchesCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Branches</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    className="w-32"
                    data-testid="input-branches-count"
                  />
                  <p className="text-sm text-gray-500">(1st branch included in base price)</p>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pricing Breakdown */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Base Price:</span>
            <span>{PLAN_PRICING[watchPlan as keyof typeof PLAN_PRICING].base.toFixed(2)} SAR</span>
          </div>
          {watchBranches > 1 && (
            <div className="flex justify-between text-sm">
              <span>Additional Branches ({watchBranches - 1}):</span>
              <span>{((watchBranches - 1) * PLAN_PRICING[watchPlan as keyof typeof PLAN_PRICING].perBranch).toFixed(2)} SAR</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{subtotal.toFixed(2)} SAR</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>VAT (15%):</span>
            <span>{vat.toFixed(2)} SAR</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span data-testid="text-total-price">{total.toFixed(2)} SAR</span>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack} disabled={isLoading} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-next-step">
            {isLoading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
            Continue to Payment <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Step 4: Payment with Moyasar
function PaymentStep({ onNext, onBack, draftId, pricing }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [moyasarLoaded, setMoyasarLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load Moyasar.js script
    const script = document.createElement('script');
    script.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
    script.async = true;
    script.onload = () => setMoyasarLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeMoyasar = async () => {
    setIsLoading(true);
    try {
      // Create payment intent
      const res = await apiRequest("POST", "/api/signup/payment-intent", { draftId });
      const response = await res.json();

      if (response.success && moyasarLoaded) {
        // Initialize Moyasar payment form
        (window as any).Moyasar.init({
          element: '#moyasar-form',
          amount: Math.round(parseFloat(response.amount) * 100), // Convert to halalas
          currency: 'SAR',
          description: `RestoPOS Subscription`,
          publishable_api_key: response.publishableKey || import.meta.env.VITE_MOYASAR_PUBLIC_KEY,
          callback_url: `${window.location.origin}/api/signup/payment-callback`,
          methods: ['creditcard', 'applepay', 'stcpay'],
          metadata: {
            draft_id: draftId,
          },
          on_initiating: function() {
            setIsLoading(true);
          },
          on_completed: function(payment: any) {
            setIsLoading(false);
            if (payment.status === 'paid') {
              toast({
                title: "Payment Successful",
                description: "Redirecting to verification...",
              });
              setTimeout(() => onNext(), 1500);
            }
          },
          on_failure: function(error: any) {
            setIsLoading(false);
            toast({
              title: "Payment Failed",
              description: error.message || "Please try again",
              variant: "destructive",
            });
          },
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (moyasarLoaded && draftId) {
      initializeMoyasar();
    }
  }, [moyasarLoaded, draftId]);

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      {pricing && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
          <h3 className="font-semibold mb-2">Payment Summary</h3>
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{pricing.subtotal?.toFixed(2)} SAR</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>VAT (15%):</span>
            <span>{pricing.vat?.toFixed(2)} SAR</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>{pricing.total?.toFixed(2)} SAR</span>
          </div>
        </div>
      )}

      {/* Moyasar Payment Form */}
      <div id="moyasar-form" className="min-h-[300px]">
        {!moyasarLoaded && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="text-sm text-gray-500 text-center">
        🔒 Secure payment powered by Moyasar (SAMA-licensed)
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading} data-testid="button-back">
          <ChevronLeft className="mr-2 w-4 h-4" /> Back
        </Button>
      </div>
    </div>
  );
}

// Step 5: OTP Verification
function OTPVerificationStep({ onNext, onBack, draftId, devOtp, setDevOtp }: any) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendOTP = async () => {
    setIsSending(true);
    try {
      const res = await apiRequest("POST", "/api/signup/send-otp", { draftId });
      const response = await res.json();

      if (response.success) {
        toast({
          title: "OTP Sent",
          description: "Check your phone for the verification code",
        });
        
        // Store dev OTP if in development
        if (response.devOtp) {
          setDevOtp(response.devOtp);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    // Auto-send OTP on mount
    sendOTP();
  }, []);

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/signup/verify-otp", { draftId, otp });
      const response = await res.json();

      if (response.success) {
        toast({
          title: "OTP Verified",
          description: "Phone number verified successfully",
        });
        onNext();
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {devOtp && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Development Mode</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">OTP Code: <strong>{devOtp}</strong></p>
        </div>
      )}

      <div className="space-y-4">
        <Label>Enter 6-digit OTP</Label>
        <Input
          type="text"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="text-center text-2xl tracking-widest"
          data-testid="input-otp"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={sendOTP}
        disabled={isSending}
        className="w-full"
        data-testid="button-resend-otp"
      >
        {isSending ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
        Resend OTP
      </Button>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading} data-testid="button-back">
          <ChevronLeft className="mr-2 w-4 h-4" /> Back
        </Button>
        <Button onClick={verifyOTP} disabled={isLoading || otp.length !== 6} data-testid="button-verify-otp">
          {isLoading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
          Verify & Continue
        </Button>
      </div>
    </div>
  );
}

// Step 6: Setup Complete with Password
function SetupCompleteStep({ draftId, onComplete }: { draftId: string; onComplete: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PasswordSetup>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {},
  });

  const onSubmit = async (data: PasswordSetup) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/signup/complete", { draftId, password: data.password });
      const response = await res.json();

      if (response.success) {
        toast({
          title: "Welcome to RestoPOS!",
          description: "Your account has been created successfully",
        });
        
        // Wait a moment then redirect
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete setup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Almost There!</h3>
        <p className="text-gray-500 text-center">Set your password to complete the setup</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} data-testid="input-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} data-testid="input-confirm-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-complete-setup">
            {isLoading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
            Complete Setup & Login
          </Button>
        </form>
      </Form>
    </div>
  );
}
