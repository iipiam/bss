import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Settings } from "@shared/schema";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Settings>>({});

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      await apiRequest("PATCH", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings saved",
        description: "Restaurant settings have been updated successfully",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof Settings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure restaurant information and preferences</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="restaurantName">Restaurant Name</Label>
                <Input
                  id="restaurantName"
                  value={formData.restaurantName || settings?.restaurantName || ""}
                  onChange={(e) => handleChange("restaurantName", e.target.value)}
                  placeholder="Enter restaurant name"
                  data-testid="input-restaurant-name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatNumber">VAT Registration Number</Label>
                <Input
                  id="vatNumber"
                  value={formData.vatNumber || settings?.vatNumber || ""}
                  onChange={(e) => handleChange("vatNumber", e.target.value)}
                  placeholder="Enter VAT number"
                  data-testid="input-vat-number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || settings?.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="info@restaurant.com"
                  data-testid="input-email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone || settings?.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+966 XX XXX XXXX"
                  data-testid="input-phone"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address || settings?.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Enter full address"
                  data-testid="input-address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Default Language</Label>
                <Select
                  value={formData.language || settings?.language || "English"}
                  onValueChange={(value) => handleChange("language", value)}
                >
                  <SelectTrigger id="language" data-testid="select-language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Arabic">العربية (Arabic)</SelectItem>
                    <SelectItem value="Chinese">中文 (Chinese)</SelectItem>
                    <SelectItem value="German">Deutsch (German)</SelectItem>
                    <SelectItem value="Hindi">हिन्दी (Hindi)</SelectItem>
                    <SelectItem value="Urdu">اردو (Urdu)</SelectItem>
                    <SelectItem value="Bengali">বাংলা (Bengali)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save-settings"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The information above will appear on all ZATCA-compliant invoices generated by the system.
            Make sure all details are accurate and up-to-date to ensure compliance with Saudi tax regulations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
