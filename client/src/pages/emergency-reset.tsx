import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Key, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function EmergencyReset() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    token: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/bootstrap-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: formData.token,
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reset password");
      }

      setIsSuccess(true);
      toast({
        title: "Password Reset Successful!",
        description: "You can now log in with your new password",
      });

      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message || "An error occurred during password reset",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-primary/5">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-primary/10 p-3 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Emergency Admin Reset</CardTitle>
          <CardDescription className="text-center">
            {isSuccess
              ? "Password has been reset successfully"
              : "Reset admin account password using your bootstrap token"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-8">
                <div className="bg-green-100 dark:bg-green-950 p-4 rounded-full">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
                </div>
              </div>
              <p className="text-center text-muted-foreground">
                Your admin password has been reset successfully.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to login page...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Bootstrap Reset Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Enter your bootstrap reset token"
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  required
                  data-testid="input-token"
                />
                <p className="text-xs text-muted-foreground">
                  This is a one-time use token provided by your system administrator
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Admin Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter admin username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                  required
                  data-testid="input-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  minLength={6}
                  required
                  data-testid="input-confirm-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  "Resetting Password..."
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Reset Admin Password
                  </>
                )}
              </Button>

              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p className="font-semibold">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Bootstrap tokens can only be used once</li>
                  <li>Only admin accounts can be reset via this method</li>
                  <li>Contact your system administrator if you don't have a token</li>
                </ul>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
