import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw } from "lucide-react";

export default function PaymentFailed() {
  const [, setLocation] = useLocation();
  const [errorDetails, setErrorDetails] = useState<{
    reason?: string;
    orderId?: string;
    paymentId?: string;
  }>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason") || params.get("error") || params.get("message");
    const orderId = params.get("orderId") || params.get("order_id");
    const paymentId = params.get("paymentId") || params.get("payment_id");

    setErrorDetails({
      reason: reason || undefined,
      orderId: orderId || undefined,
      paymentId: paymentId || undefined,
    });
  }, []);

  const getErrorMessage = (reason?: string): string => {
    if (!reason) return "Your payment could not be processed.";
    
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes("cancel")) {
      return "The payment was cancelled.";
    }
    if (reasonLower.includes("declined") || reasonLower.includes("reject")) {
      return "Your payment was declined by the bank.";
    }
    if (reasonLower.includes("expired")) {
      return "The payment session has expired.";
    }
    if (reasonLower.includes("insufficient")) {
      return "Insufficient funds in your account.";
    }
    
    return reason;
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-b from-red-50 to-background dark:from-red-950/20 dark:to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">
            Payment Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            {getErrorMessage(errorDetails.reason)}
          </p>

          {(errorDetails.orderId || errorDetails.paymentId) && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              {errorDetails.orderId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono">{errorDetails.orderId}</span>
                </div>
              )}
              {errorDetails.paymentId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment ID</span>
                  <span className="font-mono">{errorDetails.paymentId}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={() => setLocation("/pos")}
              className="w-full"
              data-testid="button-try-again"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
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

          <p className="text-xs text-center text-muted-foreground">
            If you continue to experience issues, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
