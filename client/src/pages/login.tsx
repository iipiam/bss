import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, UtensilsCrossed, Check, Languages } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/i18n/translations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages: Language[] = ['English', 'Arabic', 'Chinese', 'German', 'Hindi', 'Urdu', 'Bengali'];

export default function Login() {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCommercialReg, setSignupCommercialReg] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("weekly");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

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
      subscriptionPlan: string;
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
    onSuccess: async () => {
      toast({
        title: t.accountCreated,
        description: t.accountCreatedDesc,
      });
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
    signupMutation.mutate({
      username: signupUsername,
      password: signupPassword,
      name: signupName,
      email: signupEmail,
      commercialRegistration: signupCommercialReg,
      subscriptionPlan: subscriptionPlan,
    });
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-32 right-1/3 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <Card className="relative w-full max-w-md mx-4 border-none shadow-2xl backdrop-blur-sm bg-white/95 dark:bg-background/95">
        <CardHeader className="space-y-6 text-center pb-6">
          <div className="mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-full blur-xl opacity-50"></div>
            <div className="relative bg-gradient-to-br from-primary to-primary/80 p-5 rounded-2xl shadow-lg">
              <UtensilsCrossed className="h-14 w-14 text-white" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
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
                    className="h-11"
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
                    className="h-11"
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
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 transition-all" 
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
                  <Label htmlFor="signup-commercial-reg">{t.commercialRegistration} *</Label>
                  <Input
                    id="signup-commercial-reg"
                    type="text"
                    placeholder={t.commercialRegistrationPlaceholder}
                    value={signupCommercialReg}
                    onChange={(e) => setSignupCommercialReg(e.target.value)}
                    required
                    data-testid="input-signup-commercial-reg"
                  />
                  <p className="text-xs text-muted-foreground">{t.commercialRegistrationNote}</p>
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
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">39.90 {t.sar}</p>
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
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">119.75 {t.sar}</p>
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
                            </div>
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              {t.save} 17%
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">1,197.50 {t.sar}</p>
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

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 transition-all" 
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
        </CardContent>
      </Card>
    </div>
  );
}
