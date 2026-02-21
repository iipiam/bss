import { Card, CardContent } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";

export default function Valuations() {
  const { t } = useLanguage();
  const layout = useDeviceLayout();

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div>
        <h1 className={`${layout.text3Xl} font-bold mb-2`} data-testid="text-valuations-title">
          {(t as any).valuations || 'Valuations'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {(t as any).valuationsDescription || 'Property valuation assessments and reports'}
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Calculator className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            {(t as any).valuationsComingSoon || 'Property Valuations Coming Soon'}
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {(t as any).valuationsComingSoonDesc || 'Conduct property valuations, generate assessment reports, and track market values.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
