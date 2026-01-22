import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useDevice } from "@/contexts/DeviceContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeviceSelector() {
  const { device, setDevice, isUpdating } = useDevice();

  const devices = [
    { id: 'laptop' as const, label: 'Desktop', icon: Monitor },
    { id: 'iphone' as const, label: 'iPhone', icon: Smartphone },
    { id: 'ipad' as const, label: 'iPad', icon: Tablet },
  ];

  return (
    <div className="flex items-center rounded-md border bg-muted p-0.5" data-testid="device-selector">
      {devices.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant="ghost"
          size="sm"
          disabled={isUpdating}
          onClick={() => setDevice(id)}
          className={cn(
            "h-7 px-2.5 text-xs font-medium rounded-sm gap-1.5",
            device === id
              ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              : "hover:bg-transparent hover:text-foreground"
          )}
          data-testid={`button-device-${id}`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}
