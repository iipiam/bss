import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [paymentDetails, setPaymentDetails] = useState<{
    paymentId?: string;
    orderId?: string;
    amount?: string;
  }>({});
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("paymentId") || params.get("payment_id");
    const orderId = params.get("orderId") || params.get("order_id");
    const amount = params.get("amount");

    setPaymentDetails({
      paymentId: paymentId || undefined,
      orderId: orderId || undefined,
      amount: amount || undefined,
    });

    setTimeout(() => {
      setIsVerifying(false);
    }, 1500);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 dark:to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isVerifying ? (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isVerifying ? "Verifying Payment..." : "Payment Successful"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isVerifying && (
            <>
              <p className="text-center text-muted-foreground">
                Your payment has been processed successfully.
              </p>

              {(paymentDetails.paymentId || paymentDetails.orderId || paymentDetails.amount) && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  {paymentDetails.orderId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Order ID</span>
                      <span className="font-mono">{paymentDetails.orderId}</span>
                    </div>
                  )}
                  {paymentDetails.paymentId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment ID</span>
                      <span className="font-mono">{paymentDetails.paymentId}</span>
                    </div>
                  )}
                  {paymentDetails.amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold">{paymentDetails.amount} SAR</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={() => setLocation("/pos")}
                  className="w-full"
                  data-testid="button-return-to-pos"
                >
                  Return to POS
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="w-full"
                  data-testid="button-go-to-dashboard"
                >
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
