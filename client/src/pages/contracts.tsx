import { Card, CardContent } from "@/components/ui/card";
import { Handshake } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";

export default function Contracts() {
  const { t } = useLanguage();
  const layout = useDeviceLayout();

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div>
        <h1 className={`${layout.text3Xl} font-bold mb-2`} data-testid="text-contracts-title">
          {(t as any).contracts || 'Contracts'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {(t as any).contractsDescription || 'Manage your real estate contracts and deals'}
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Handshake className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            {(t as any).contractsComingSoon || 'Contracts Management Coming Soon'}
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {(t as any).contractsComingSoonDesc || 'Track and manage all your property contracts, lease agreements, and sales deals in one place.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
