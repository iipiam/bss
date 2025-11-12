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
import { Save, Laptop, Tablet, Smartphone, Volume2, Bell, MessageSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { notificationTones, toneIds, playNotificationTone, getToneName, type ToneId } from "@/lib/notificationTones";

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
      <NotificationToneSection />
      <ChatNotificationSection />
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

function NotificationToneSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedTone, setSelectedTone] = useState<ToneId>('tone1');

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings?.notificationTone) {
      setSelectedTone(settings.notificationTone as ToneId);
    }
  }, [settings]);

  const updateToneMutation = useMutation({
    mutationFn: async (toneId: ToneId) => {
      await apiRequest("PATCH", "/api/settings", { notificationTone: toneId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: t.success || "Success",
        description: "Notification tone updated for all accounts",
      });
    },
    onError: () => {
      toast({
        title: t.error || "Error",
        description: "Failed to update notification tone",
        variant: "destructive",
      });
    },
  });

  const handleToneChange = (toneId: ToneId) => {
    setSelectedTone(toneId);
    updateToneMutation.mutate(toneId);
  };

  const handleTestTone = (toneId: ToneId) => {
    playNotificationTone(toneId);
  };

  // Only show for admin users
  if (user?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t.notificationTone || "Notification Tone"}
        </CardTitle>
        <CardDescription>
          {t.notificationToneDescription || "Select a notification tone for order alerts. This applies to all sub-accounts immediately."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {toneIds.map((toneId) => (
            <button
              key={toneId}
              type="button"
              onClick={() => handleToneChange(toneId)}
              disabled={updateToneMutation.isPending}
              className={`
                relative p-4 border-2 rounded-lg transition-all
                hover-elevate active-elevate-2
                ${selectedTone === toneId 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border'
                }
              `}
              data-testid={`button-tone-${toneId}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">
                  {getToneName(toneId)}
                </h4>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestTone(toneId);
                  }}
                  data-testid={`button-test-${toneId}`}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{notificationTones[toneId].frequency}Hz</span>
                <span>•</span>
                <span>{notificationTones[toneId].duration}ms</span>
              </div>
              {selectedTone === toneId && (
                <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
        {updateToneMutation.isPending && (
          <p className="text-sm text-muted-foreground">
            {t.updatingTone || "Updating tone for all accounts..."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ChatNotificationSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedChatTone, setSelectedChatTone] = useState<ToneId>('tone1');

  const { data: chatSettings, isLoading } = useQuery<{
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    toneId: string;
  }>({
    queryKey: ["/api/chat/notification-settings"],
  });

  useEffect(() => {
    if (chatSettings) {
      setNotificationsEnabled(chatSettings.notificationsEnabled);
      setSoundEnabled(chatSettings.soundEnabled);
      setSelectedChatTone(chatSettings.toneId as ToneId);
    }
  }, [chatSettings]);

  const updateChatSettingsMutation = useMutation({
    mutationFn: async (data: {
      notificationsEnabled?: boolean;
      soundEnabled?: boolean;
      toneId?: string;
    }) => {
      await apiRequest("PATCH", "/api/chat/notification-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/notification-settings"] });
      toast({
        title: t.success,
        description: t.chatNotificationSettingsUpdated || "Chat notification settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: t.error,
        description: t.failedToUpdateChatSettings || "Failed to update chat notification settings",
        variant: "destructive",
      });
    },
  });

  const handleNotificationsToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    updateChatSettingsMutation.mutate({ notificationsEnabled: enabled });
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    updateChatSettingsMutation.mutate({ soundEnabled: enabled });
  };

  const handleChatToneChange = (toneId: ToneId) => {
    setSelectedChatTone(toneId);
    updateChatSettingsMutation.mutate({ toneId });
  };

  const handleTestChatTone = (toneId: ToneId) => {
    playNotificationTone(toneId);
  };

  if (user?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <CardTitle>{t.chatNotifications || "Team Chat Notifications"}</CardTitle>
        </div>
        <CardDescription>
          {t.chatNotificationsDesc || "Configure notification settings for Team Chat (applies to all users)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <Label htmlFor="chat-notifications" className="font-medium">
                {t.enableChatNotifications || "Enable Chat Notifications"}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.enableChatNotificationsDesc || "Show notifications when new chat messages arrive"}
            </p>
          </div>
          <Switch
            id="chat-notifications"
            checked={notificationsEnabled}
            onCheckedChange={handleNotificationsToggle}
            disabled={updateChatSettingsMutation.isPending}
            data-testid="switch-chat-notifications"
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <Label htmlFor="chat-sound" className="font-medium">
                {t.enableChatSound || "Enable Notification Sound"}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.enableChatSoundDesc || "Play a sound when chat notifications appear"}
            </p>
          </div>
          <Switch
            id="chat-sound"
            checked={soundEnabled}
            onCheckedChange={handleSoundToggle}
            disabled={updateChatSettingsMutation.isPending || !notificationsEnabled}
            data-testid="switch-chat-sound"
          />
        </div>

        {soundEnabled && notificationsEnabled && (
          <div className="space-y-3">
            <Label>{t.chatNotificationTone || "Notification Tone"}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {toneIds.map((toneId) => (
                <button
                  key={toneId}
                  type="button"
                  onClick={() => handleChatToneChange(toneId)}
                  disabled={updateChatSettingsMutation.isPending}
                  className={`
                    relative p-4 border-2 rounded-lg transition-all
                    hover-elevate active-elevate-2
                    ${selectedChatTone === toneId 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                    }
                  `}
                  data-testid={`button-chat-tone-${toneId}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">
                      {getToneName(toneId)}
                    </h4>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestChatTone(toneId);
                      }}
                      data-testid={`button-test-chat-${toneId}`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{notificationTones[toneId].frequency}Hz</span>
                    <span>•</span>
                    <span>{notificationTones[toneId].duration}ms</span>
                  </div>
                  {selectedChatTone === toneId && (
                    <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {updateChatSettingsMutation.isPending && (
          <p className="text-sm text-muted-foreground">
            {t.updatingSettings || "Updating settings..."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
