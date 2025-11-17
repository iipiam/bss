import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

type DeviceType = 'laptop' | 'ipad' | 'iphone';

interface DeviceContextType {
  device: DeviceType;
  setDevice: (device: DeviceType) => Promise<void>;
  isUpdating: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [device, setDeviceState] = useState<DeviceType>('laptop');

  // Apply device preference from user profile
  useEffect(() => {
    if (user?.devicePreference) {
      setDeviceState(user.devicePreference as DeviceType);
    }
  }, [user]);

  // Apply device class to document element for CSS targeting
  useEffect(() => {
    const root = document.documentElement;
    // Remove all device classes
    root.classList.remove('device-laptop', 'device-ipad', 'device-iphone');
    // Add current device class
    root.classList.add(`device-${device}`);
  }, [device]);

  const updateDeviceMutation = useMutation({
    mutationFn: async (devicePreference: DeviceType) => {
      await apiRequest("PATCH", "/api/auth/me", { devicePreference });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const setDevice = async (newDevice: DeviceType) => {
    const previousDevice = device;
    setDeviceState(newDevice);
    try {
      await updateDeviceMutation.mutateAsync(newDevice);
    } catch (error) {
      // Rollback to previous device state on error
      setDeviceState(previousDevice);
      throw error;
    }
  };

  return (
    <DeviceContext.Provider value={{ device, setDevice, isUpdating: updateDeviceMutation.isPending }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used within DeviceProvider");
  }
  return context;
}
