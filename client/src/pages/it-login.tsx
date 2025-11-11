import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import kinzhalLogo from "@assets/IMG_8731_1762870212105.jpeg";

export default function ITLogin() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  // Redirect if already logged in as IT staff
  useEffect(() => {
    if (user && user.userType === 'it_staff') {
      setLocation("/support");
    } else if (user && user.userType !== 'it_staff') {
      // If logged in as restaurant user, redirect to main login
      setLocation("/login");
    }
  }, [user, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/auth/it-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      // Refresh the page to trigger auth context update
      window.location.href = "/support";
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img 
              src={kinzhalLogo} 
              alt="RestoPOS Logo" 
              className="h-20 w-20 object-contain rounded-lg"
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">IT Staff Login</CardTitle>
          </div>
          <CardDescription>
            Access the support system to manage tickets and assist restaurant clients
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your IT staff username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoggingIn}
              data-testid="button-login"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {isLoggingIn ? "Logging in..." : "Login as IT Staff"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>Restaurant user?</p>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => setLocation("/login")}
                data-testid="link-restaurant-login"
              >
                Go to Restaurant Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
