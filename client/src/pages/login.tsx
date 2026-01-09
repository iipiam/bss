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
import { LogIn, UserPlus, Check, Languages, Play, Video, Mail, HelpCircle, MessageCircle, Upload, FileText, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import kinzhalLogo from "@assets/kinzhal-eagle-logo.jpeg";
import { Language, supportedLanguages } from "@/i18n/translations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WelcomeVideo } from "@/components/WelcomeVideo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPlanPricing, type SubscriptionPlan, type BusinessType } from "@shared/subscriptionPricing";

// Use the authoritative supportedLanguages array from translations
const languages: Language[] = supportedLanguages;

export default function Login() {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [accountType, setAccountType] = useState<"client" | "it">("client");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCommercialReg, setSignupCommercialReg] = useState("");
  const [signupRestaurantName, setSignupRestaurantName] = useState("");
  const [signupNationalId, setSignupNationalId] = useState("");
  const [hasVatRegistration, setHasVatRegistration] = useState<boolean | null>(null); // null = not selected yet
  const [signupTaxNumber, setSignupTaxNumber] = useState("");
  const [signupBusinessType, setSignupBusinessType] = useState<BusinessType>("restaurant"); // "restaurant" or "factory"
  const [signupRestaurantType, setSignupRestaurantType] = useState(""); // Specific subtype (e.g., "Cloud Kitchen", "Restaurant", etc.)
  const [branchesCount, setBranchesCount] = useState(1);
  // Default to monthly for all business types (factory can only use monthly/yearly anyway)
  const [subscriptionPlan, setSubscriptionPlan] = useState("monthly");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  const [legalAcknowledgementChecked, setLegalAcknowledgementChecked] = useState(false);
  
  // Document upload fields
  const [crCertificate, setCrCertificate] = useState<File | null>(null);
  const [vatCertificate, setVatCertificate] = useState<File | null>(null);
  const [ibanCertificate, setIbanCertificate] = useState<File | null>(null);
  const [nationalAddress, setNationalAddress] = useState<File | null>(null);
  
  // IT Signup fields
  const [itSignupUsername, setItSignupUsername] = useState("");
  const [itSignupPassword, setItSignupPassword] = useState("");
  const [itSignupFullName, setItSignupFullName] = useState("");
  const [itSignupEmail, setItSignupEmail] = useState("");
  const [itSignupSecretKey, setItSignupSecretKey] = useState("");
  
  const { login } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  // Calculate total price with branches (VAT-inclusive)
  const calculateTotalPrice = () => {
    const pricing = getPlanPricing(subscriptionPlan as SubscriptionPlan, branchesCount, signupBusinessType);
    return pricing.grossAmount.toFixed(2);
  };
  
  // Get pricing breakdown for display
  const getPricingBreakdown = () => {
    return getPlanPricing(subscriptionPlan as SubscriptionPlan, branchesCount, signupBusinessType);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      await login(loginUsername, loginPassword, accountType);
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
      hasVatRegistration: boolean;
      taxNumber: string;
      businessType: string;
      restaurantType: string;
      subscriptionPlan: string;
      branchesCount: number;
      crCertificate?: File | null;
      vatCertificate?: File | null;
      ibanCertificate?: File | null;
      nationalAddress?: File | null;
    }) => {
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("password", data.password);
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("commercialRegistration", data.commercialRegistration);
      formData.append("restaurantName", data.restaurantName);
      formData.append("nationalId", data.nationalId);
      formData.append("hasVatRegistration", data.hasVatRegistration.toString());
      if (data.hasVatRegistration && data.taxNumber) {
        formData.append("taxNumber", data.taxNumber);
      }
      formData.append("businessType", data.businessType);
      formData.append("restaurantType", data.restaurantType);
      formData.append("subscriptionPlan", data.subscriptionPlan);
      formData.append("branchesCount", data.branchesCount.toString());
      
      if (data.crCertificate) formData.append("crCertificate", data.crCertificate);
      // VAT certificate is only required when hasVatRegistration is true
      if (data.hasVatRegistration && data.vatCertificate) formData.append("vatCertificate", data.vatCertificate);
      if (data.ibanCertificate) formData.append("ibanCertificate", data.ibanCertificate);
      if (data.nationalAddress) formData.append("nationalAddress", data.nationalAddress);
      
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch {
          error = { error: undefined };
        }
        throw error;
      }
      
      return response.json();
    },
    onSuccess: async (data: any) => {
      toast({
        title: t.accountCreated,
        description: t.accountCreatedDesc,
      });
      
      setLegalAcknowledgementChecked(false);
      
      // Auto-login after signup
      try {
        await login(signupUsername, signupPassword);
        
        if (data.invoiceFilename) {
          try {
            const response = await fetch(`/api/subscription-invoices/${data.invoiceFilename}`);
            if (!response.ok) {
              throw new Error('Failed to download invoice');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = data.invoiceFilename;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            
            toast({
              title: t.invoiceDownloaded,
              description: t.invoiceDownloadedDesc,
            });
          } catch (error) {
            console.error('Failed to download invoice:', error);
            toast({
              title: t.invoiceDownloadFailed,
              description: t.invoiceDownloadFailedDesc,
              variant: "destructive",
            });
          }
        }
      } catch (error: any) {
        toast({
          title: t.loginFailed,
          description: t.accountCreatedDesc,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('[SIGNUP ERROR] Full error object:', error);
      
      toast({
        title: t.signUpFailed,
        description: error.error || error.message || t.signUpFailedDesc,
        variant: "destructive",
      });
    },
  });

  // IT Signup handler
  const handleITSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itSignupUsername || !itSignupPassword || !itSignupFullName || !itSignupEmail || !itSignupSecretKey) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all fields including the secret key",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch("/api/auth/it-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: itSignupUsername,
          password: itSignupPassword,
          fullName: itSignupFullName,
          email: itSignupEmail,
          secretKey: itSignupSecretKey,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create IT account");
      }
      
      toast({
        title: "IT Account Created",
        description: "Your IT account has been created successfully. Please login with your credentials.",
      });
      
      // Auto-login after IT signup
      await login(itSignupUsername, itSignupPassword, "it");
      
    } catch (error: any) {
      toast({
        title: t.itSignupFailed,
        description: error.message || "Failed to create IT account",
        variant: "destructive",
      });
    }
  };
  
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
    if (!signupRestaurantName || !signupNationalId || !signupRestaurantType) {
      toast({
        title: t.missingRequiredFields,
        description: t.fillAllRequiredFields,
        variant: "destructive",
      });
      return;
    }
    
    // Validate VAT registration selection
    if (hasVatRegistration === null) {
      toast({
        title: t.missingRequiredFields,
        description: t.selectVatRegistrationStatus || "Please select whether you have VAT registration",
        variant: "destructive",
      });
      return;
    }
    
    // If VAT registration is yes, require tax number and VAT certificate
    if (hasVatRegistration && !signupTaxNumber) {
      toast({
        title: t.missingRequiredFields,
        description: t.taxNumberRequired || "Tax number is required when you have VAT registration",
        variant: "destructive",
      });
      return;
    }
    
    if (hasVatRegistration && !vatCertificate) {
      toast({
        title: t.missingRequiredFields,
        description: t.vatCertificateRequired || "VAT certificate is required when you have VAT registration",
        variant: "destructive",
      });
      return;
    }
    
    // Validate National ID must be exactly 10 digits
    const nationalIdDigits = signupNationalId.replace(/\D/g, ''); // Remove non-digits
    if (nationalIdDigits.length !== 10) {
      toast({
        title: t.invalidNationalId,
        description: t.nationalIdMustBe10Digits,
        variant: "destructive",
      });
      return;
    }
    
    // Validate Commercial Registration must be exactly 10 digits
    const commercialRegDigits = signupCommercialReg.replace(/\D/g, ''); // Remove non-digits
    if (commercialRegDigits.length !== 10) {
      toast({
        title: t.invalidCommercialReg,
        description: t.commercialRegMustBe10Digits,
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
      hasVatRegistration: hasVatRegistration!, // Already validated above
      taxNumber: signupTaxNumber,
      businessType: signupBusinessType,
      restaurantType: signupRestaurantType,
      subscriptionPlan: subscriptionPlan,
      branchesCount: branchesCount,
      crCertificate,
      vatCertificate,
      ibanCertificate,
      nationalAddress,
    });
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 dark:from-primary/30 dark:via-primary/20 dark:to-primary/10">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
              <img src={kinzhalLogo} alt="BlindSpot System" className="h-14 w-14 object-contain" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-foreground">
              BlindSpot System (BSS)
            </CardTitle>
            <CardDescription className="text-base">{t.businessManagementSystem}</CardDescription>
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
                      See how BSS transforms businesses • 30 sec
                    </p>
                  </div>
                </div>
                <Video className="h-8 w-8 text-primary-foreground/80 group-hover:text-primary-foreground transition-colors" />
              </div>
            </Button>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login" data-testid="tab-login">{t.login}</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">{t.signup}</TabsTrigger>
              <TabsTrigger value="it-signup" data-testid="tab-it-signup">IT Signup</TabsTrigger>
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
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account Type</Label>
                  <RadioGroup
                    value={accountType}
                    onValueChange={(value: "client" | "it") => setAccountType(value)}
                    className="flex gap-4"
                    data-testid="radio-account-type"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="client" id="account-client" data-testid="radio-account-client" />
                      <Label htmlFor="account-client" className="font-normal cursor-pointer">
                        Client Account
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="it" id="account-it" data-testid="radio-account-it" />
                      <Label htmlFor="account-it" className="font-normal cursor-pointer">
                        IT Account
                      </Label>
                    </div>
                  </RadioGroup>
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
                  <Label htmlFor="signup-restaurant-name">{t.businessNameLabel} *</Label>
                  <Input
                    id="signup-restaurant-name"
                    type="text"
                    placeholder={t.enterRestaurantName}
                    value={signupRestaurantName}
                    onChange={(e) => setSignupRestaurantName(e.target.value)}
                    required
                    data-testid="input-signup-restaurant-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-national-id">{t.nationalIdLabel} *</Label>
                  <Input
                    id="signup-national-id"
                    type="text"
                    placeholder={t.enterNationalIdPlaceholder}
                    value={signupNationalId}
                    onChange={(e) => setSignupNationalId(e.target.value)}
                    required
                    maxLength={10}
                    pattern="\d{10}"
                    data-testid="input-signup-national-id"
                  />
                  <p className="text-xs text-muted-foreground">{t.nationalIdMustBe10Digits}</p>
                </div>
                {/* VAT Registration Question */}
                <div className="space-y-2">
                  <Label>{t.doYouHaveVatRegistration || "Do you have VAT Registration?"} *</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={hasVatRegistration === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHasVatRegistration(true)}
                      data-testid="button-vat-yes"
                    >
                      {t.yes || "Yes"}
                    </Button>
                    <Button
                      type="button"
                      variant={hasVatRegistration === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setHasVatRegistration(false);
                        setSignupTaxNumber(""); // Clear tax number when No is selected
                        setVatCertificate(null); // Clear VAT certificate when No is selected
                      }}
                      data-testid="button-vat-no"
                    >
                      {t.no || "No"}
                    </Button>
                  </div>
                </div>
                
                {/* Tax Number - Only shown when VAT registration is Yes */}
                {hasVatRegistration === true && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-tax-number">{t.taxNumberLabel} *</Label>
                    <Input
                      id="signup-tax-number"
                      type="text"
                      placeholder={t.enterTaxNumberPlaceholder}
                      value={signupTaxNumber}
                      onChange={(e) => setSignupTaxNumber(e.target.value)}
                      required
                      data-testid="input-signup-tax-number"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-business-type">{t.businessTypeLabel} *</Label>
                  <Select
                    value={signupBusinessType}
                    onValueChange={(value: BusinessType) => {
                      setSignupBusinessType(value);
                      setSignupRestaurantType(""); // Reset subtype when business type changes
                      // Reset to monthly for factory (no weekly option)
                      if (value === "factory" && subscriptionPlan === "weekly") {
                        setSubscriptionPlan("monthly");
                      }
                    }}
                  >
                    <SelectTrigger id="signup-business-type" data-testid="select-signup-business-type">
                      <SelectValue placeholder={t.selectBusinessTypePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant / Food Service</SelectItem>
                      <SelectItem value="factory">Factory / Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {signupBusinessType && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-restaurant-type">
                      {signupBusinessType === "factory" ? `${t.factoryTypeLabel} *` : `${t.restaurantTypeLabel} *`}
                    </Label>
                    <Select
                      value={signupRestaurantType}
                      onValueChange={setSignupRestaurantType}
                    >
                      <SelectTrigger id="signup-restaurant-type" data-testid="select-signup-restaurant-type">
                        <SelectValue placeholder={signupBusinessType === "factory" ? t.selectFactoryTypePlaceholder : t.selectRestaurantTypePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {signupBusinessType === "restaurant" ? (
                          <>
                            <SelectItem value="Cloud Kitchen">Cloud Kitchen</SelectItem>
                            <SelectItem value="Restaurant">Restaurant</SelectItem>
                            <SelectItem value="Coffee Shop">Coffee Shop</SelectItem>
                            <SelectItem value="Tea Shop">Tea Shop</SelectItem>
                            <SelectItem value="Sweets">Sweets</SelectItem>
                            <SelectItem value="Bakery">Bakery</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="Production">Production</SelectItem>
                            <SelectItem value="Assembly">Assembly</SelectItem>
                            <SelectItem value="Processing">Processing</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-commercial-reg">{t.commercialRegistration} *</Label>
                  <Input
                    id="signup-commercial-reg"
                    type="text"
                    placeholder={t.commercialRegistrationPlaceholder}
                    value={signupCommercialReg}
                    onChange={(e) => setSignupCommercialReg(e.target.value)}
                    required
                    maxLength={10}
                    pattern="\d{10}"
                    data-testid="input-signup-commercial-reg"
                  />
                  <p className="text-xs text-muted-foreground">{t.commercialRegMustBe10Digits}</p>
                </div>
                
                {/* Document Upload Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <Label className="text-sm font-semibold">{t.businessDocuments || "Business Documents"} ({t.optional || "Optional"})</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.uploadBusinessDocumentsDesc || "Upload your business documents (PDF only, max 10MB each). These can also be uploaded later."}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CR Certificate */}
                    <div className="space-y-2">
                      <Label htmlFor="cr-certificate" className="text-sm">{t.crCertificate || "CR Certificate"}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="cr-certificate"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setCrCertificate(e.target.files?.[0] || null)}
                          className="hidden"
                          data-testid="input-cr-certificate"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => document.getElementById('cr-certificate')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {crCertificate ? crCertificate.name.substring(0, 20) + "..." : t.uploadFile || "Upload File"}
                        </Button>
                        {crCertificate && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setCrCertificate(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* VAT Certificate - Only shown when hasVatRegistration is true */}
                    {hasVatRegistration === true && (
                      <div className="space-y-2">
                        <Label htmlFor="vat-certificate" className="text-sm">{t.vatCertificate || "VAT Certificate"} *</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="vat-certificate"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setVatCertificate(e.target.files?.[0] || null)}
                            className="hidden"
                            data-testid="input-vat-certificate"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => document.getElementById('vat-certificate')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {vatCertificate ? vatCertificate.name.substring(0, 20) + "..." : t.uploadFile || "Upload File"}
                          </Button>
                          {vatCertificate && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setVatCertificate(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* IBAN Certificate */}
                    <div className="space-y-2">
                      <Label htmlFor="iban-certificate" className="text-sm">{t.ibanCertificate || "IBAN Certificate"}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="iban-certificate"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setIbanCertificate(e.target.files?.[0] || null)}
                          className="hidden"
                          data-testid="input-iban-certificate"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => document.getElementById('iban-certificate')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {ibanCertificate ? ibanCertificate.name.substring(0, 20) + "..." : t.uploadFile || "Upload File"}
                        </Button>
                        {ibanCertificate && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setIbanCertificate(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* National Address */}
                    <div className="space-y-2">
                      <Label htmlFor="national-address" className="text-sm">{t.nationalAddress || "National Address"}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="national-address"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setNationalAddress(e.target.files?.[0] || null)}
                          className="hidden"
                          data-testid="input-national-address"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => document.getElementById('national-address')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {nationalAddress ? nationalAddress.name.substring(0, 20) + "..." : t.uploadFile || "Upload File"}
                        </Button>
                        {nationalAddress && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setNationalAddress(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-branches">{t.numberOfBranchesLabel} *</Label>
                  <Input
                    id="signup-branches"
                    type="number"
                    min="1"
                    placeholder={t.enterBranchesPlaceholder}
                    value={branchesCount}
                    onChange={(e) => setBranchesCount(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    data-testid="input-signup-branches"
                  />
                  <p className="text-xs text-muted-foreground">
                    {signupBusinessType === "factory" ? (
                      `Additional branches: +2,400.00 ${t.sar}/month per branch, +28,800.00 ${t.sar}/year per branch (VAT included)`
                    ) : (
                      `Additional branches: +${(getPlanPricing('weekly', 2, 'restaurant').grossAmount - getPlanPricing('weekly', 1, 'restaurant').grossAmount).toFixed(2)} ${t.sar}/week, +${(getPlanPricing('monthly', 2, 'restaurant').grossAmount - getPlanPricing('monthly', 1, 'restaurant').grossAmount).toFixed(2)} ${t.sar}/month per branch (VAT included)`
                    )}
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
                    {signupBusinessType === "restaurant" && (
                      <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors ${
                        subscriptionPlan === 'weekly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}>
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
                              <p className="text-xl font-bold">{getPlanPricing('weekly', branchesCount, signupBusinessType).grossAmount.toFixed(2)} {t.sar}</p>
                              <p className="text-xs text-muted-foreground">per week (VAT included)</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    )}

                    <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors ${
                      subscriptionPlan === 'monthly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}>
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
                            <p className="text-xl font-bold">{getPlanPricing('monthly', branchesCount, signupBusinessType).grossAmount.toFixed(2)} {t.sar}</p>
                            <p className="text-xs text-muted-foreground">{t.perMonth} (VAT included)</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors ${
                      subscriptionPlan === 'yearly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}>
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
                            <p className="text-xl font-bold">{getPlanPricing('yearly', branchesCount, signupBusinessType).grossAmount.toFixed(2)} {t.sar}</p>
                            <p className="text-xs text-muted-foreground">{t.perYear} (VAT included)</p>
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
            
            <TabsContent value="it-signup" className="space-y-4 pt-2">
              <form onSubmit={handleITSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="it-signup-fullname">Full Name *</Label>
                  <Input
                    id="it-signup-fullname"
                    type="text"
                    placeholder="Enter your full name"
                    value={itSignupFullName}
                    onChange={(e) => setItSignupFullName(e.target.value)}
                    required
                    data-testid="input-it-signup-fullname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="it-signup-email">Email *</Label>
                  <Input
                    id="it-signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={itSignupEmail}
                    onChange={(e) => setItSignupEmail(e.target.value)}
                    required
                    data-testid="input-it-signup-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="it-signup-username">Username *</Label>
                  <Input
                    id="it-signup-username"
                    type="text"
                    placeholder="Choose a username"
                    value={itSignupUsername}
                    onChange={(e) => setItSignupUsername(e.target.value)}
                    required
                    data-testid="input-it-signup-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="it-signup-password">Password *</Label>
                  <Input
                    id="it-signup-password"
                    type="password"
                    placeholder="Choose a strong password"
                    value={itSignupPassword}
                    onChange={(e) => setItSignupPassword(e.target.value)}
                    required
                    data-testid="input-it-signup-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="it-signup-secret">Secret Key *</Label>
                  <Input
                    id="it-signup-secret"
                    type="password"
                    placeholder="Enter the IT secret key"
                    value={itSignupSecretKey}
                    onChange={(e) => setItSignupSecretKey(e.target.value)}
                    required
                    data-testid="input-it-signup-secret"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact your IT administrator for the secret key
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-[44px] bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-600/20 transition-all" 
                  data-testid="button-it-signup"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create IT Account
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
                <div className="flex flex-wrap gap-2">
                  <a 
                    href="mailto:it@kinbss.com"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors hover-elevate active-elevate-2 px-3 py-2 rounded-md"
                    data-testid="link-support-email"
                  >
                    <Mail className="h-4 w-4" />
                    it@kinbss.com
                  </a>
                  <a 
                    href="https://wa.me/966502171067"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors hover-elevate active-elevate-2 px-3 py-2 rounded-md"
                    data-testid="link-support-whatsapp"
                  >
                    <MessageCircle className="h-4 w-4" />
                    +966502171067
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
        
        {/* Branding Footer */}
        <div className="text-center branding-slide" data-testid="branding-footer">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <img src={kinzhalLogo} alt="BSS Logo" className="h-12 w-auto object-contain" />
              <p className="text-sm text-white/80">
                {t.madeBy} <span className="font-semibold text-white">{t.companyName}</span>
              </p>
            </div>
            <p className="text-xs text-white/60">{t.copyright}</p>
            <p className="text-xs text-white/50">{t.tagline}</p>
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
