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
  const [subscriptionPlan, setSubscriptionPlan] = useState("monthly");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      await login(loginUsername, loginPassword);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
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
        title: "Account created!",
        description: "Please sign in with your credentials.",
      });
      // Auto-login after signup
      try {
        await login(signupUsername, signupPassword);
      } catch (error: any) {
        toast({
          title: "Login failed",
          description: "Please try logging in manually.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Sign up failed",
        description: error.message || "Could not create account",
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-primary/5">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <UtensilsCrossed className="h-12 w-12 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">RestoPOS</CardTitle>
            <CardDescription>Restaurant management system</CardDescription>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger className="w-40" data-testid="select-language">
                <SelectValue placeholder="Select language" />
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
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter your username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                    data-testid="input-login-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    data-testid="input-login-password"
                  />
                </div>
                <div className="flex justify-end">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                    data-testid="link-forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" className="w-full" disabled={isLoggingIn} data-testid="button-login">
                  {isLoggingIn ? (
                    "Signing in..."
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    data-testid="input-signup-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    data-testid="input-signup-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-commercial-reg">Commercial Registration *</Label>
                  <Input
                    id="signup-commercial-reg"
                    type="text"
                    placeholder="Saudi Commercial Registration number"
                    value={signupCommercialReg}
                    onChange={(e) => setSignupCommercialReg(e.target.value)}
                    required
                    data-testid="input-signup-commercial-reg"
                  />
                  <p className="text-xs text-muted-foreground">Required for all restaurant businesses in Saudi Arabia</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="Choose a username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    required
                    data-testid="input-signup-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Choose a password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-signup-password"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Subscription Plan</Label>
                  <RadioGroup value={subscriptionPlan} onValueChange={setSubscriptionPlan} data-testid="radiogroup-subscription">
                    <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      subscriptionPlan === 'monthly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`} onClick={() => setSubscriptionPlan('monthly')}>
                      <RadioGroupItem value="monthly" id="monthly" data-testid="radio-monthly" />
                      <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">Monthly</p>
                            <p className="text-sm text-muted-foreground">Billed monthly</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">119.75 SAR</p>
                            <p className="text-xs text-muted-foreground">per month</p>
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
                              <p className="font-semibold">Yearly</p>
                              <p className="text-sm text-muted-foreground">Billed annually</p>
                            </div>
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              Save 17%
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">1,197.50 SAR</p>
                            <p className="text-xs text-muted-foreground">per year</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    All prices include 15% VAT as required by Saudi law
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={signupMutation.isPending} 
                  data-testid="button-signup"
                >
                  {signupMutation.isPending ? (
                    "Creating account..."
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account & Continue to Payment
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
