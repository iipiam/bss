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
    let isMounted = true;
    let initTimeout: NodeJS.Timeout | null = null;
    
    // Set a timeout for initialization
    initTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        setError('Payment form initialization timed out. Please check your internet connection and try again.');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    const loadMoyasarScript = async () => {
      try {
        if (!isMounted) return;
        
        if (window.Moyasar) {
          await initializeMoyasar();
          if (initTimeout) clearTimeout(initTimeout);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
        script.async = true;
        script.onload = async () => {
          if (!isMounted) return;
          
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
          document.head.appendChild(link);
          
          await initializeMoyasar();
          if (initTimeout) clearTimeout(initTimeout);
        };
        script.onerror = () => {
          if (!isMounted) return;
          
          if (initTimeout) clearTimeout(initTimeout);
          setError('Failed to load payment gateway scripts. Please check your internet connection.');
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } catch (err) {
        if (!isMounted) return;
        
        if (initTimeout) clearTimeout(initTimeout);
        setError('Unexpected error loading payment form');
        setIsLoading(false);
      }
    };

    const initializeMoyasar = async () => {
      if (!isMounted) return;
      try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        const publishableKey = settings.moyasarPublishableKey;

        if (!isMounted) return;
        
        if (!publishableKey || publishableKey === 'null' || publishableKey === 'undefined') {
          setError('Payment gateway not configured. Please contact support to set up Moyasar API keys.');
          setIsLoading(false);
          return;
        }

        // Wait for form ref to be available (with retries)
        let retries = 0;
        while (!formRef.current && retries < 20 && isMounted) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }

        if (!isMounted) return;
        
        if (!formRef.current) {
          setError('Payment form container not ready. Please refresh the page and try again.');
          setIsLoading(false);
          return;
        }

        if (!window.Moyasar) {
          setError('Moyasar SDK not loaded');
          setIsLoading(false);
          return;
        }

        if (!isMounted) return;
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
              console.error('[Moyasar] Verification error:', err);
              setPaymentStatus('failed');
              onError('Payment verification error');
            }
          },
          on_failure: (error: any) => {
            console.error('[Moyasar] Payment failed:', error);
            setPaymentStatus('failed');
            onError(error.message || 'Payment failed');
          },
        });

        setIsLoading(false);
      } catch (err) {
        console.error('[Moyasar] Initialization error:', err);
        setError(`Failed to initialize payment form: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    loadMoyasarScript();

    return () => {
      isMounted = false;
      
      if (initTimeout) {
        clearTimeout(initTimeout);
        initTimeout = null;
      }
      
      if (moyasarInstanceRef.current && moyasarInstanceRef.current.teardown) {
        moyasarInstanceRef.current.teardown();
        moyasarInstanceRef.current = null;
      }
    };
  }, [amount, description, orderId, customerName, customerPhone, onSuccess, onError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
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

        {paymentStatus === 'processing' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying payment...</p>
          </div>
        )}

        {!error && paymentStatus === 'idle' && (
          <>
            {isLoading && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading payment form...</p>
              </div>
            )}

            <div className={isLoading ? 'hidden' : ''}>
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
            </div>
          </>
        )}
        
        {onCancel && !paymentStatus && (
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
