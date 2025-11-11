import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevice } from "@/contexts/DeviceContext";
import { useAuth } from "@/lib/auth";
import type { Settings } from "@shared/schema";
import { Save, Laptop, Tablet, Smartphone } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
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
        title: t.success,
        description: t.settingsUpdated,
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
        <h1 className="text-3xl font-bold mb-2">{t.settings}</h1>
        <p className="text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t.settings}</h1>
        <p className="text-muted-foreground">{t.settingsDescription}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t.restaurantInformation}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="restaurantName">{t.restaurantName}</Label>
                <Input
                  id="restaurantName"
                  value={formData.restaurantName || settings?.restaurantName || ""}
                  onChange={(e) => handleChange("restaurantName", e.target.value)}
                  placeholder={t.enterRestaurantName}
                  data-testid="input-restaurant-name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatNumber">{t.vatNumber}</Label>
                <Input
                  id="vatNumber"
                  value={formData.vatNumber || settings?.vatNumber || ""}
                  onChange={(e) => handleChange("vatNumber", e.target.value)}
                  placeholder={t.enterVatNumber}
                  data-testid="input-vat-number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || settings?.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder={t.enterEmail}
                  data-testid="input-email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t.phone}</Label>
                <Input
                  id="phone"
                  value={formData.phone || settings?.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder={t.enterPhone}
                  data-testid="input-phone"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">{t.address}</Label>
                <Input
                  id="address"
                  value={formData.address || settings?.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder={t.enterAddress}
                  data-testid="input-address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">{t.language}</Label>
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

              <div className="space-y-2">
                <Label htmlFor="openingTime">{t.openingTime}</Label>
                <Input
                  id="openingTime"
                  type="time"
                  value={formData.openingTime || settings?.openingTime || ""}
                  onChange={(e) => handleChange("openingTime", e.target.value)}
                  placeholder="09:00"
                  data-testid="input-opening-time"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closingTime">{t.closingTime}</Label>
                <Input
                  id="closingTime"
                  type="time"
                  value={formData.closingTime || settings?.closingTime || ""}
                  onChange={(e) => handleChange("closingTime", e.target.value)}
                  placeholder="22:00"
                  data-testid="input-closing-time"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save-settings"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? t.savingSettings : t.updateSettings}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>{t.invoiceConfiguration}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t.invoiceConfigurationDescription}
          </p>
        </CardContent>
      </Card>

      <DevicePreferenceSection />
    </div>
  );
}

function DevicePreferenceSection() {
  const { device, setDevice, isUpdating } = useDevice();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleDeviceChange = async (newDevice: 'laptop' | 'ipad' | 'iphone') => {
    try {
      await setDevice(newDevice);
      const deviceLabel = newDevice === 'laptop' ? t.laptop : newDevice === 'ipad' ? t.ipad : t.iphone;
      toast({
        title: t.success,
        description: `${t.devicePreferenceUpdated} ${deviceLabel}`,
      });
    } catch (error) {
      toast({
        title: t.error,
        description: t.failedToUpdateDevicePreference,
        variant: "destructive",
      });
    }
  };

  const deviceOptions = [
    { value: 'laptop' as const, label: t.laptop, icon: Laptop, description: t.laptopDesc },
    { value: 'ipad' as const, label: t.ipad, icon: Tablet, description: t.ipadDesc },
    { value: 'iphone' as const, label: t.iphone, icon: Smartphone, description: t.iphoneDesc },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.accountAndDevicePreference}</CardTitle>
        <CardDescription>
          {t.accountAndDevicePreferenceDesc}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.account}</Label>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || user?.username}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.roleAndStatus}</Label>
              <div className="p-3 bg-muted rounded-md space-y-1">
                <p className="text-sm"><span className="font-medium">{t.role}:</span> {user?.role}</p>
                <p className="text-sm"><span className="font-medium">{t.status}:</span> {user?.active ? t.active : t.inactive}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label>{t.devicePreference}</Label>
            <div className="grid gap-3">
              {deviceOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = device === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleDeviceChange(option.value)}
                    disabled={isUpdating}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover-elevate active-elevate-2'
                    }`}
                    data-testid={`button-device-${option.value}`}
                  >
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{option.label}</h3>
                        {isSelected && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            {t.active}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t.deviceLayoutNote}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
