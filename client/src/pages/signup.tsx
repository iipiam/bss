import { useState } from "react";
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
import { ChevronLeft, ChevronRight, Check, Building2, User, CreditCard, Smartphone, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Step 1: Company Information
const companyInfoSchema = z.object({
  restaurantName: z.string().min(3, "Restaurant name must be at least 3 characters"),
  commercialRegistration: z.string().min(10, "Commercial registration number is required"),
  nationalId: z.string().min(10, "National ID is required"),
  taxNumber: z.string().min(15, "VAT number must be 15 digits"),
  restaurantType: z.enum(["Restaurant", "Cloud Kitchen", "Coffee Shop", "Tea Shop", "Sweets Shop"]),
  address: z.string().min(10, "Full address is required"),
  phone: z.string().min(10, "Phone number is required"),
});

// Step 2: Owner Details
const ownerDetailsSchema = z.object({
  ownerName: z.string().min(3, "Owner name is required"),
  ownerEmail: z.string().email("Valid email is required"),
  ownerPhone: z.string().min(10, "Phone number is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Step 3: Plan Selection
const planSelectionSchema = z.object({
  plan: z.enum(["weekly", "monthly", "yearly"]),
  branchesCount: z.number().min(1, "At least 1 branch is required"),
});

// Combined schema for all steps
type CompanyInfo = z.infer<typeof companyInfoSchema>;
type OwnerDetails = z.infer<typeof ownerDetailsSchema>;
type PlanSelection = z.infer<typeof planSelectionSchema>;

interface SignupData {
  companyInfo?: CompanyInfo;
  ownerDetails?: OwnerDetails;
  planSelection?: PlanSelection;
  paymentSuccess?: boolean;
  otpVerified?: boolean;
}

const PLAN_PRICING = {
  weekly: { base: 39.90, perBranch: 7 },
  monthly: { base: 119.75, perBranch: 20 },
  yearly: { base: 1197.50, perBranch: 240 },
};

export default function Signup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState<SignupData>({});
  const { toast } = useToast();

  const steps = [
    { number: 1, title: "Company Info", icon: Building2 },
    { number: 2, title: "Owner Details", icon: User },
    { number: 3, title: "Plan Selection", icon: Settings },
    { number: 4, title: "Payment", icon: CreditCard },
    { number: 5, title: "OTP Verification", icon: Smartphone },
    { number: 6, title: "Setup Complete", icon: Check },
  ];

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

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
              {currentStep === 4 && "Secure payment powered by Stripe"}
              {currentStep === 5 && "Enter the code sent to your phone"}
              {currentStep === 6 && "Your account is ready to use"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && <CompanyInfoStep onNext={handleNext} signupData={signupData} setSignupData={setSignupData} />}
            {currentStep === 2 && <OwnerDetailsStep onNext={handleNext} onBack={handleBack} signupData={signupData} setSignupData={setSignupData} />}
            {currentStep === 3 && <PlanSelectionStep onNext={handleNext} onBack={handleBack} signupData={signupData} setSignupData={setSignupData} />}
            {currentStep === 4 && <PaymentStep onNext={handleNext} onBack={handleBack} signupData={signupData} setSignupData={setSignupData} />}
            {currentStep === 5 && <OTPVerificationStep onNext={handleNext} onBack={handleBack} signupData={signupData} />}
            {currentStep === 6 && <SetupCompleteStep />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Step 1: Company Information
function CompanyInfoStep({ onNext, signupData, setSignupData }: any) {
  const form = useForm<CompanyInfo>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: signupData.companyInfo || {},
  });

  const onSubmit = (data: CompanyInfo) => {
    setSignupData({ ...signupData, companyInfo: data });
    onNext();
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
          name="phone"
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

        <div className="flex justify-end pt-4">
          <Button type="submit" className="w-full md:w-auto" data-testid="button-next-step">
            Next <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Step 2: Owner Details
function OwnerDetailsStep({ onNext, onBack, signupData, setSignupData }: any) {
  const form = useForm<OwnerDetails>({
    resolver: zodResolver(ownerDetailsSchema),
    defaultValues: signupData.ownerDetails || {},
  });

  const onSubmit = (data: OwnerDetails) => {
    setSignupData({ ...signupData, ownerDetails: data });
    onNext();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <FormItem>
              <FormLabel>Username (for login)</FormLabel>
              <FormControl>
                <Input placeholder="ahmed_admin" {...field} data-testid="input-username" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <Button type="submit" data-testid="button-next-step">
            Next <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Step 3: Plan Selection
function PlanSelectionStep({ onNext, onBack, signupData, setSignupData }: any) {
  const form = useForm<PlanSelection>({
    resolver: zodResolver(planSelectionSchema),
    defaultValues: signupData.planSelection || { plan: "monthly", branchesCount: 1 },
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

  const onSubmit = (data: PlanSelection) => {
    setSignupData({ ...signupData, planSelection: data });
    onNext();
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
          <Button type="button" variant="outline" onClick={onBack} data-testid="button-back">
            <ChevronLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <Button type="submit" data-testid="button-next-step">
            Continue to Payment <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Step 4: Payment (Placeholder - will integrate Stripe)
function PaymentStep({ onNext, onBack, signupData, setSignupData }: any) {
  const { toast } = useToast();

  const handlePayment = () => {
    // TODO: Integrate Stripe payment
    toast({
      title: "Payment Integration Pending",
      description: "Stripe integration will be added in Task 8",
    });
    setSignupData({ ...signupData, paymentSuccess: true });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          🔒 Secure payment powered by Stripe. Your payment information is encrypted and never stored on our servers.
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-semibold">Payment Summary:</p>
        <p>Plan: {signupData.planSelection?.plan || "N/A"}</p>
        <p>Branches: {signupData.planSelection?.branchesCount || 1}</p>
      </div>

      {/* Stripe Elements will go here */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">Stripe payment form will appear here</p>
        <p className="text-sm text-gray-400 mt-2">(Integration pending - Task 8)</p>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} data-testid="button-back">
          <ChevronLeft className="mr-2 w-4 h-4" /> Back
        </Button>
        <Button onClick={handlePayment} data-testid="button-process-payment">
          Process Payment <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 5: OTP Verification (Placeholder - will integrate Twilio)
function OTPVerificationStep({ onNext, onBack, signupData }: any) {
  const [otp, setOtp] = useState("");
  const { toast } = useToast();

  const handleVerify = () => {
    // TODO: Integrate Twilio OTP
    if (otp.length === 6) {
      toast({
        title: "OTP Verification Pending",
        description: "Twilio SMS integration will be added in Task 9",
      });
      onNext();
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <p className="text-sm text-green-700 dark:text-green-300">
          📱 We've sent a 6-digit verification code to {signupData.ownerDetails?.ownerPhone || "your phone"}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <Smartphone className="w-16 h-16 text-orange-500" />
        <Input
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="text-center text-2xl tracking-widest w-64"
          maxLength={6}
          data-testid="input-otp"
        />
        <Button variant="ghost" className="text-sm" data-testid="button-resend-otp">
          Didn't receive the code? Resend
        </Button>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} data-testid="button-back">
          <ChevronLeft className="mr-2 w-4 h-4" /> Back
        </Button>
        <Button onClick={handleVerify} disabled={otp.length !== 6} data-testid="button-verify-otp">
          Verify & Complete <Check className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 6: Setup Complete
function SetupCompleteStep() {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-12 h-12 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
        Your Account is Ready!
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        Welcome to RestoPOS! Your restaurant management system is now set up and ready to use.
      </p>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          📧 We've sent a confirmation email to {" "}
          <span className="font-semibold">your email</span> with login instructions and next steps.
        </p>
      </div>
      <Button size="lg" className="w-full md:w-auto" data-testid="button-go-to-dashboard">
        Go to Dashboard <ChevronRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
}
