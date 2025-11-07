import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Mail, Phone, CreditCard, Calendar, AlertTriangle, CheckCircle2, XCircle, Shield } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const profileSchema = z.object({
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserType>({
    queryKey: ["/api/profile"],
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("/api/profile", "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/subscription/cancel", "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. Please repay to continue using the service.",
        variant: "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      email: profile?.email || "",
      phone: profile?.phone || "",
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancelSubscription = () => {
    cancelSubscriptionMutation.mutate();
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSubscriptionStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" data-testid="badge-subscription-active">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" data-testid="badge-subscription-cancelled">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" data-testid="badge-subscription-expired">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" data-testid="badge-subscription-inactive">
            Inactive
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load profile information.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isSubscriptionCancelled = profile.subscriptionStatus === "cancelled" || profile.subscriptionStatus === "expired";

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-profile-title">User Profile</h1>
        <p className="text-muted-foreground">Manage your account information and subscription</p>
      </div>

      {isSubscriptionCancelled && (
        <Alert variant="destructive" data-testid="alert-subscription-restricted">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your account access is restricted because your subscription has been cancelled. Please renew your subscription to regain full access.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl">Profile Information</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </div>
            <User className="h-8 w-8 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
              <p className="text-base font-medium" data-testid="text-fullname">{profile.fullName}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Username</Label>
              <p className="text-base font-medium" data-testid="text-username">{profile.username}</p>
            </div>

            <Separator />

            {isEditing ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="inline-block mr-2 h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    {...form.register("email")}
                    data-testid="input-email"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline-block mr-2 h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+966 XX XXX XXXX"
                    {...form.register("phone")}
                    data-testid="input-phone"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      form.reset();
                    }}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    <Mail className="inline-block mr-2 h-4 w-4" />
                    Email
                  </Label>
                  <p className="text-base font-medium" data-testid="text-email">{profile.email || "Not set"}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    <Phone className="inline-block mr-2 h-4 w-4" />
                    Phone Number
                  </Label>
                  <p className="text-base font-medium" data-testid="text-phone">{profile.phone || "Not set"}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    <Shield className="inline-block mr-2 h-4 w-4" />
                    Role
                  </Label>
                  <p className="text-base font-medium capitalize" data-testid="text-role">{profile.role || "Employee"}</p>
                </div>

                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full"
                  variant="outline"
                  data-testid="button-edit-profile"
                >
                  Edit Profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Subscription Details Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl">Subscription Details</CardTitle>
              <CardDescription>Your subscription information</CardDescription>
            </div>
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Commercial Registration</Label>
              <p className="text-base font-medium" data-testid="text-commercial-registration">
                {profile.commercialRegistration || "Not set"}
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Subscription Plan</Label>
              <p className="text-base font-medium capitalize" data-testid="text-subscription-plan">
                {profile.subscriptionPlan || "None"}
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <div>{getSubscriptionStatusBadge(profile.subscriptionStatus)}</div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                <Calendar className="inline-block mr-2 h-4 w-4" />
                Start Date
              </Label>
              <p className="text-base font-medium" data-testid="text-subscription-start">
                {formatDate(profile.subscriptionStartDate)}
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                <Calendar className="inline-block mr-2 h-4 w-4" />
                End Date
              </Label>
              <p className="text-base font-medium" data-testid="text-subscription-end">
                {formatDate(profile.subscriptionEndDate)}
              </p>
            </div>

            {profile.subscriptionCancelledAt && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    <Calendar className="inline-block mr-2 h-4 w-4" />
                    Cancelled On
                  </Label>
                  <p className="text-base font-medium text-red-600 dark:text-red-400" data-testid="text-subscription-cancelled">
                    {formatDate(profile.subscriptionCancelledAt)}
                  </p>
                </div>
              </>
            )}

            {profile.subscriptionStatus === "active" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    data-testid="button-cancel-subscription"
                  >
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel your subscription. Your account will be restricted until you renew your subscription.
                      You can continue using the service until your current subscription period ends on{" "}
                      <strong>{formatDate(profile.subscriptionEndDate)}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-dialog">No, Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      className="bg-red-600 hover:bg-red-700"
                      data-testid="button-confirm-cancel"
                    >
                      Yes, Cancel Subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
