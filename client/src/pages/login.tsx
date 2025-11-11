import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, UtensilsCrossed, Check, Languages, Play, Video, Mail, HelpCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/i18n/translations";
import kinzhalLogo from "@assets/IMG_8731_1762870212105.jpeg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WelcomeVideo } from "@/components/WelcomeVideo";
import { ThemeToggle } from "@/components/theme-toggle";

const languages: Language[] = ['English', 'Arabic', 'Chinese', 'German', 'Hindi', 'Urdu', 'Bengali'];

export default function Login() {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCommercialReg, setSignupCommercialReg] = useState("");
  const [signupRestaurantName, setSignupRestaurantName] = useState("");
  const [signupNationalId, setSignupNationalId] = useState("");
  const [signupTaxNumber, setSignupTaxNumber] = useState("");
  const [signupRestaurantType, setSignupRestaurantType] = useState("");
  const [branchesCount, setBranchesCount] = useState(1);
  const [subscriptionPlan, setSubscriptionPlan] = useState("weekly");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  const [legalAcknowledgementChecked, setLegalAcknowledgementChecked] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  // Calculate total price with branches
  const calculateTotalPrice = () => {
    const basePrices = {
      weekly: 55.78,
      monthly: 167.42,
      yearly: 1674.24
    };
    
    const perBranchPrices = {
      weekly: 9.79,
      monthly: 27.96,
      yearly: 335.58
    };
    
    const basePrice = basePrices[subscriptionPlan as keyof typeof basePrices];
    const branchPrice = perBranchPrices[subscriptionPlan as keyof typeof perBranchPrices];
    const additionalBranches = Math.max(0, branchesCount - 1); // First branch is included
    
    return (basePrice + (branchPrice * additionalBranches)).toFixed(2);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      await login(loginUsername, loginPassword);
      toast({
        title: t.welcomeBack,
        description: t.loginSuccessDesc,
      });
    } catch (error: any) {
      toast({
        title: t.loginFailed,
        description: error.message || t.invalidCredentials,
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const signupMutation = useMutation({
    mutationFn: async (data: { 
      username: string; 
      password: string; 
      name: string; 
      email: string; 
      commercialRegistration: string;
      restaurantName: string;
      nationalId: string;
      taxNumber: string;
      restaurantType: string;
      subscriptionPlan: string;
      branchesCount: number;
    }) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create account");
      }
      
      return response.json();
    },
    onSuccess: async (data: any) => {
      toast({
        title: t.accountCreated,
        description: t.accountCreatedDesc,
      });
      
      // Auto-download subscription invoice PDF if available
      if (data.invoicePath) {
        try {
          const link = document.createElement('a');
          link.href = data.invoicePath;
          link.download = data.invoicePath.split('/').pop() || 'subscription-invoice.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Invoice Downloaded",
            description: "Your subscription invoice has been downloaded automatically.",
          });
        } catch (error) {
          console.error('Failed to download invoice:', error);
        }
      }
      
      // Reset legal acknowledgement checkbox
      setLegalAcknowledgementChecked(false);
      
      // Auto-login after signup
      try {
        await login(signupUsername, signupPassword);
      } catch (error: any) {
        toast({
          title: t.loginFailed,
          description: t.accountCreatedDesc,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: t.signUpFailed,
        description: error.message || t.signUpFailedDesc,
        variant: "destructive",
      });
    },
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate legal acknowledgement checkbox
    if (!legalAcknowledgementChecked) {
      toast({
        title: t.error,
        description: t.legalAcknowledgementRequired,
        variant: "destructive",
      });
      return;
    }
    
    // Validate required fields
    if (!signupRestaurantName || !signupNationalId || !signupTaxNumber || !signupRestaurantType) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields: Restaurant Name, National ID, Tax Number, and Restaurant Type",
        variant: "destructive",
      });
      return;
    }
    
    // Validate National ID must be exactly 10 digits
    const nationalIdDigits = signupNationalId.replace(/\D/g, ''); // Remove non-digits
    if (nationalIdDigits.length !== 10) {
      toast({
        title: "Invalid National ID",
        description: "National ID must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }
    
    // Validate Commercial Registration must be exactly 10 digits
    const commercialRegDigits = signupCommercialReg.replace(/\D/g, ''); // Remove non-digits
    if (commercialRegDigits.length !== 10) {
      toast({
        title: "Invalid Commercial Registration",
        description: "Commercial Registration must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }
    
    signupMutation.mutate({
      username: signupUsername,
      password: signupPassword,
      name: signupName,
      email: signupEmail,
      commercialRegistration: signupCommercialReg,
      restaurantName: signupRestaurantName,
      nationalId: signupNationalId,
      taxNumber: signupTaxNumber,
      restaurantType: signupRestaurantType,
      subscriptionPlan: subscriptionPlan,
      branchesCount: branchesCount,
    });
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 dark:from-primary/30 dark:via-primary/20 dark:to-primary/10">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 dark:bg-primary/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-white/5 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-32 right-1/3 w-72 h-72 bg-white/10 dark:bg-primary/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header with Theme Toggle */}
      <div className="absolute top-0 left-0 right-0 flex justify-end p-4 z-10">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-md mx-4 mt-16">
        <Card className="relative w-full border-none shadow-2xl backdrop-blur-sm bg-card">
        <CardHeader className="space-y-6 text-center pb-6">
          <div className="mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-full blur-xl opacity-50"></div>
            <div className="relative bg-gradient-to-br from-primary to-primary/80 p-5 rounded-2xl shadow-lg">
              <UtensilsCrossed className="h-14 w-14 text-white" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-foreground">
              RestoPOS
            </CardTitle>
            <CardDescription className="text-base">{t.restaurantManagementSystem}</CardDescription>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                <SelectTrigger className="w-36 border-none bg-transparent" data-testid="select-language">
                  <SelectValue placeholder={t.selectLanguage} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem 
                      key={lang} 
                      value={lang}
                      data-testid={`option-language-${lang.toLowerCase()}`}
                    >
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Video Preview Card - Watch before signing up */}
          <div className="mb-6">
            <Button
              onClick={() => setShowWelcomeVideo(true)}
              variant="default"
              className="w-full group relative overflow-hidden rounded-xl h-auto p-6 text-left justify-start"
              data-testid="button-watch-intro-video"
            >
              <div className="flex items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 bg-primary-foreground/20 rounded-full p-3 group-hover:bg-primary-foreground/30 transition-colors">
                    <Play className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-primary-foreground mb-1">
                      Watch Our Success Story
                    </h3>
                    <p className="text-sm text-primary-foreground/90">
                      See how RestoPOS transforms businesses • 30 sec
                    </p>
                  </div>
                </div>
                <Video className="h-8 w-8 text-primary-foreground/80 group-hover:text-primary-foreground transition-colors" />
              </div>
            </Button>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">{t.login}</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">{t.signup}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-5 pt-2">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-username" className="text-sm font-medium">{t.username}</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder={t.enterUsername}
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                    className="h-[44px]"
                    data-testid="input-login-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">{t.password}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder={t.enterPassword}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-[44px]"
                    data-testid="input-login-password"
                  />
                </div>
                <div className="flex justify-end">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    data-testid="link-forgot-password"
                  >
                    {t.forgotPassword}?
                  </Link>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-[44px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 transition-all" 
                  disabled={isLoggingIn} 
                  data-testid="button-login"
                >
                  {isLoggingIn ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t.signingIn}
                    </span>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      {t.signIn}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 pt-2">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t.fullName}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={t.enterFullName}
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    data-testid="input-signup-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t.email}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={t.enterEmail}
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    data-testid="input-signup-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-restaurant-name">Restaurant Name *</Label>
                  <Input
                    id="signup-restaurant-name"
                    type="text"
                    placeholder="Enter your restaurant name"
                    value={signupRestaurantName}
                    onChange={(e) => setSignupRestaurantName(e.target.value)}
                    required
                    data-testid="input-signup-restaurant-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-national-id">National ID / Company Name *</Label>
                  <Input
                    id="signup-national-id"
                    type="text"
                    placeholder="Enter 10-digit National ID or Company Name"
                    value={signupNationalId}
                    onChange={(e) => setSignupNationalId(e.target.value)}
                    required
                    maxLength={10}
                    pattern="\d{10}"
                    data-testid="input-signup-national-id"
                  />
                  <p className="text-xs text-muted-foreground">Must be exactly 10 digits</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-tax-number">Unified Tax Number *</Label>
                  <Input
                    id="signup-tax-number"
                    type="text"
                    placeholder="Enter Unified Tax Number"
                    value={signupTaxNumber}
                    onChange={(e) => setSignupTaxNumber(e.target.value)}
                    required
                    data-testid="input-signup-tax-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-restaurant-type">Restaurant Type *</Label>
                  <Select
                    value={signupRestaurantType}
                    onValueChange={setSignupRestaurantType}
                  >
                    <SelectTrigger id="signup-restaurant-type" data-testid="select-signup-restaurant-type">
                      <SelectValue placeholder="Select Restaurant Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cloud Kitchen">Cloud Kitchen</SelectItem>
                      <SelectItem value="Restaurant">Restaurant</SelectItem>
                      <SelectItem value="Coffee Shop">Coffee Shop</SelectItem>
                      <SelectItem value="Tea Shop">Tea Shop</SelectItem>
                      <SelectItem value="Sweets">Sweets</SelectItem>
                      <SelectItem value="Bakery">Bakery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-commercial-reg">{t.commercialRegistration} *</Label>
                  <Input
                    id="signup-commercial-reg"
                    type="text"
                    placeholder="Enter 10-digit Commercial Registration"
                    value={signupCommercialReg}
                    onChange={(e) => setSignupCommercialReg(e.target.value)}
                    required
                    maxLength={10}
                    pattern="\d{10}"
                    data-testid="input-signup-commercial-reg"
                  />
                  <p className="text-xs text-muted-foreground">Must be exactly 10 digits</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-branches">Number of Branches *</Label>
                  <Input
                    id="signup-branches"
                    type="number"
                    min="1"
                    placeholder="Enter number of branches"
                    value={branchesCount}
                    onChange={(e) => setBranchesCount(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    data-testid="input-signup-branches"
                  />
                  <p className="text-xs text-muted-foreground">
                    Additional branches: +{7} {t.sar}/week, +{20} {t.sar}/month per branch
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-username">{t.username}</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder={t.chooseUsername}
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    required
                    data-testid="input-signup-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t.password}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder={t.choosePassword}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-signup-password"
                  />
                </div>

                <div className="space-y-3">
                  <Label>{t.subscriptionPlan}</Label>
                  <RadioGroup value={subscriptionPlan} onValueChange={setSubscriptionPlan} data-testid="radiogroup-subscription">
                    <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      subscriptionPlan === 'weekly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`} onClick={() => setSubscriptionPlan('weekly')}>
                      <RadioGroupItem value="weekly" id="weekly" data-testid="radio-weekly" />
                      <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">Weekly</p>
                            <p className="text-sm text-muted-foreground">Billed weekly</p>
                            {branchesCount > 1 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {branchesCount} branches
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{(55.78 + (branchesCount - 1) * 9.79).toFixed(2)} {t.sar}</p>
                            <p className="text-xs text-muted-foreground">per week</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      subscriptionPlan === 'monthly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`} onClick={() => setSubscriptionPlan('monthly')}>
                      <RadioGroupItem value="monthly" id="monthly" data-testid="radio-monthly" />
                      <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{t.monthly}</p>
                            <p className="text-sm text-muted-foreground">{t.billedMonthly}</p>
                            {branchesCount > 1 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {branchesCount} branches
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{(167.42 + (branchesCount - 1) * 27.96).toFixed(2)} {t.sar}</p>
                            <p className="text-xs text-muted-foreground">{t.perMonth}</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      subscriptionPlan === 'yearly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`} onClick={() => setSubscriptionPlan('yearly')}>
                      <RadioGroupItem value="yearly" id="yearly" data-testid="radio-yearly" />
                      <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-semibold">{t.yearly}</p>
                              <p className="text-sm text-muted-foreground">{t.billedYearly}</p>
                              {branchesCount > 1 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {branchesCount} branches
                                </p>
                              )}
                            </div>
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              {t.save} 17%
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{(1674.24 + (branchesCount - 1) * 335.58).toFixed(2)} {t.sar}</p>
                            <p className="text-xs text-muted-foreground">{t.perYear}</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    {t.vatDisclaimer}
                  </p>
                </div>

                {/* Legal Acknowledgement */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t.legalAcknowledgement.substring(0, 30)}...</Label>
                    <ScrollArea className="h-32 w-full rounded-md border p-3 bg-background">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t.legalAcknowledgement}
                      </p>
                    </ScrollArea>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="legal-acknowledgement"
                      checked={legalAcknowledgementChecked}
                      onCheckedChange={(checked) => setLegalAcknowledgementChecked(checked === true)}
                      data-testid="checkbox-legal-acknowledgement"
                      className="mt-1"
                    />
                    <Label
                      htmlFor="legal-acknowledgement"
                      className="text-sm font-medium leading-relaxed cursor-pointer flex-1"
                    >
                      {t.legalAcknowledgementRequired}
                    </Label>
                  </div>
                  {!legalAcknowledgementChecked && (
                    <p className="text-xs text-destructive" data-testid="text-legal-acknowledgement-error">
                      * {t.legalAcknowledgementRequired}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-[44px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 transition-all" 
                  disabled={signupMutation.isPending} 
                  data-testid="button-signup"
                >
                  {signupMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t.loading}...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      {t.signup}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Support & Help Section */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border" data-testid="section-support-help">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {t.supportAndHelp}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.contactInformation}
                </p>
                <a 
                  href="mailto:it@saudikinzhal.org"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors hover-elevate active-elevate-2 px-3 py-2 rounded-md"
                  data-testid="link-support-email"
                >
                  <Mail className="h-4 w-4" />
                  it@saudikinzhal.org
                </a>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
        
        {/* Branding Footer */}
        <div className="text-center branding-slide" data-testid="branding-footer">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <img src={kinzhalLogo} alt="Saudi Kinzhal Logo" className="h-10 w-10 object-contain" />
              <p className="text-sm text-white/80">
                Made By <span className="font-semibold text-white">Saudi Kinzhal</span>
              </p>
            </div>
            <p className="text-xs text-white/60">© 2025 Saudi Kinzhal. All rights reserved.</p>
            <p className="text-xs text-white/50">Empowering restaurants with innovative POS solutions</p>
          </div>
        </div>
      </div>

      {/* Welcome Video Dialog */}
      <WelcomeVideo 
        open={showWelcomeVideo} 
        onClose={() => setShowWelcomeVideo(false)} 
      />
    </div>
  );
}
