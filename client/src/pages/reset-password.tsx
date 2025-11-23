import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Check } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Get token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get("token");
    if (resetToken) {
      setToken(resetToken);
    } else {
      toast({
        title: t.invalidResetLink,
        description: t.invalidResetLinkDesc,
        variant: "destructive",
      });
      setTimeout(() => setLocation("/login"), 3000);
    }
  }, [setLocation, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t.passwordsDontMatch,
        description: t.passwordsDontMatchDesc,
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t.passwordTooShort,
        description: t.passwordTooShortDesc,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t.failedToResetPassword);
      }

      setIsSuccess(true);
      toast({
        title: t.passwordResetSuccessful,
        description: t.passwordResetSuccessfulDesc,
      });

      // Redirect to login after 3 seconds
      setTimeout(() => setLocation("/login"), 3000);
    } catch (error: any) {
      toast({
        title: t.failedToResetPassword,
        description: error.message || t.pleaseTryAgainOrRequestNew,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-primary/5">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">{t.resetPassword}</CardTitle>
          <CardDescription>
            {isSuccess
              ? t.passwordResetSuccessfulDesc
              : t.resetPasswordDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-8">
                <div className="bg-green-100 dark:bg-green-950 p-4 rounded-full">
                  <Check className="h-12 w-12 text-green-600 dark:text-green-500" />
                </div>
              </div>
              <p className="text-center text-muted-foreground">
                {t.redirectingToLogin}
              </p>
              <Link href="/login" className="block">
                <Button className="w-full" data-testid="button-go-to-login">
                  {t.goToLogin}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t.newPassword}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t.enterNewPasswordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t.confirmNewPassword}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t.enterConfirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
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
                  t.resetting
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    {t.resetPassword}
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
