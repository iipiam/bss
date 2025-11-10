import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

declare global {
  interface Window {
    Moyasar: any;
  }
}

interface MoyasarPaymentProps {
  amount: number;
  description: string;
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

export function MoyasarPayment({
  amount,
  description,
  orderId,
  customerName,
  customerPhone,
  onSuccess,
  onError,
  onCancel,
}: MoyasarPaymentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const formRef = useRef<HTMLDivElement>(null);
  const moyasarInstanceRef = useRef<any>(null);

  useEffect(() => {
    const loadMoyasarScript = async () => {
      if (window.Moyasar) {
        initializeMoyasar();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
      script.async = true;
      script.onload = () => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
        document.head.appendChild(link);
        
        initializeMoyasar();
      };
      script.onerror = () => {
        setError('Failed to load payment gateway');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    const initializeMoyasar = async () => {
      try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        const publishableKey = settings.moyasarPublishableKey;

        if (!publishableKey) {
          setError('Payment gateway not configured');
          setIsLoading(false);
          return;
        }

        if (!formRef.current) return;

        moyasarInstanceRef.current = window.Moyasar.init({
          element: formRef.current,
          amount: Math.round(amount * 100),
          currency: 'SAR',
          description: description,
          publishable_api_key: publishableKey,
          callback_url: window.location.origin + '/api/payments/callback',
          methods: ['creditcard', 'applepay', 'stcpay'],
          metadata: {
            orderId: orderId || '',
            customerName: customerName || '',
            customerPhone: customerPhone || '',
          },
          on_completed: async (payment: any) => {
            setPaymentStatus('processing');
            try {
              const verifyResponse = await apiRequest('POST', '/api/payments/verify', {
                paymentId: payment.id,
              });
              const result = await verifyResponse.json();
              
              if (result.status === 'paid') {
                setPaymentStatus('success');
                onSuccess(payment.id);
              } else {
                setPaymentStatus('failed');
                onError('Payment verification failed');
              }
            } catch (err) {
              setPaymentStatus('failed');
              onError('Payment verification error');
            }
          },
          on_failure: (error: any) => {
            setPaymentStatus('failed');
            onError(error.message || 'Payment failed');
          },
        });

        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize payment form');
        setIsLoading(false);
      }
    };

    loadMoyasarScript();

    return () => {
      if (moyasarInstanceRef.current && moyasarInstanceRef.current.teardown) {
        moyasarInstanceRef.current.teardown();
      }
    };
  }, [amount, description, orderId, customerName, customerPhone, onSuccess, onError]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading payment form...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">Payment Successful</h3>
            <p className="text-sm text-muted-foreground">Your payment has been processed successfully</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'processing') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying payment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
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
        
        <div ref={formRef} className="moyasar-form" data-testid="moyasar-payment-form"></div>
        
        {onCancel && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
