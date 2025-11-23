import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Key, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EmergencyReset() {
  const { t } = useLanguage();
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
        title: t.passwordsDontMatch,
        description: t.passwordsMatchError,
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: t.passwordTooShort,
        description: t.passwordMinLengthError,
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
        throw new Error(error.error || t.failedToResetPassword);
      }

      setIsSuccess(true);
      toast({
        title: t.passwordResetSuccess,
        description: t.passwordResetSuccessDesc,
      });

      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    } catch (error: any) {
      toast({
        title: t.passwordResetFailed,
        description: error.message || t.resetPasswordError,
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
          <CardTitle className="text-2xl text-center">{t.emergencyAdminReset}</CardTitle>
          <CardDescription className="text-center">
            {isSuccess
              ? t.passwordResetSuccess
              : t.resetPasswordBootstrapDesc}
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
                {t.yourAdminPasswordReset}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                {t.redirectingToLogin}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">{t.bootstrapResetToken}</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder={t.enterBootstrapToken}
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  required
                  data-testid="input-token"
                />
                <p className="text-xs text-muted-foreground">
                  {t.bootstrapTokenDescription}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">{t.adminUsername}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={t.enterAdminUsername}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.newPassword}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t.enterNewPasswordPlaceholder}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                  required
                  data-testid="input-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t.confirmNewPassword}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t.enterConfirmPasswordPlaceholder}
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
                  t.resetting
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    {t.resetAdminPassword}
                  </>
                )}
              </Button>

              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p className="font-semibold">{t.importantNotes}</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>{t.bootstrapTokenOnceUse}</li>
                  <li>{t.onlyAdminReset}</li>
                  <li>{t.contactAdministrator}</li>
                </ul>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
