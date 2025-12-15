import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface GeideaPaymentProps {
  amount: number;
  description: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  language?: 'en' | 'ar';
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

export function GeideaPayment({
  amount,
  description,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  language = 'en',
  onSuccess,
  onError,
  onCancel,
}: GeideaPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'redirecting' | 'success' | 'failed'>('idle');

  const handlePayNow = async () => {
    setIsLoading(true);
    setError(null);
    setPaymentStatus('processing');

    try {
      const response = await apiRequest('POST', '/api/geidea/create-session', {
        amount,
        description,
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        language,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create payment session');
      }

      if (result.redirectUrl) {
        setPaymentStatus('redirecting');
        window.location.href = result.redirectUrl;
      } else {
        throw new Error('No redirect URL received from payment gateway');
      }
    } catch (err: any) {
      console.error('[Geidea] Payment error:', err);
      setError(err.message || 'Payment failed');
      setPaymentStatus('failed');
      onError(err.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {paymentStatus === 'success' && (
          <div className="flex flex-col items-center gap-3 text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">Payment Successful</h3>
            <p className="text-sm text-muted-foreground">Your payment has been processed successfully</p>
          </div>
        )}

        {paymentStatus === 'redirecting' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Redirecting to payment gateway...</p>
          </div>
        )}

        {paymentStatus === 'processing' && !error && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Creating payment session...</p>
          </div>
        )}

        {(paymentStatus === 'idle' || paymentStatus === 'failed') && !isLoading && (
          <>
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-lg font-semibold">{amount.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Description</span>
                <span className="text-sm">{description}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handlePayNow}
                className="w-full"
                size="lg"
                data-testid="button-geidea-pay"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>

              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="w-full"
                  data-testid="button-cancel-payment"
                >
                  Cancel
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              You will be redirected to a secure payment page
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
