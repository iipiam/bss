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

  useEffect(() => {
    if (user?.devicePreference) {
      setDeviceState(user.devicePreference as DeviceType);
    }
  }, [user]);

  const updateDeviceMutation = useMutation({
    mutationFn: async (devicePreference: DeviceType) => {
      await apiRequest("PATCH", "/api/auth/me", { devicePreference });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const setDevice = async (newDevice: DeviceType) => {
    setDeviceState(newDevice);
    await updateDeviceMutation.mutateAsync(newDevice);
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
