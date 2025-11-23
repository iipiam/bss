import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoyasarPayment } from "@/components/MoyasarPayment";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PaymentTest() {
  const { t } = useLanguage();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [amount, setAmount] = useState(t.testPaymentAmount);
  const [description, setDescription] = useState(t.testPaymentDescription);
  const [customerName, setCustomerName] = useState(t.testCustomerName);
  const [customerPhone, setCustomerPhone] = useState(t.testCustomerPhone);
  const { toast } = useToast();

  // Update state when language changes
  useEffect(() => {
    setAmount(t.testPaymentAmount);
    setDescription(t.testPaymentDescription);
    setCustomerName(t.testCustomerName);
    setCustomerPhone(t.testCustomerPhone);
  }, [t.testPaymentAmount, t.testPaymentDescription, t.testCustomerName, t.testCustomerPhone]);

  const handlePaymentSuccess = (paymentId: string) => {
    toast({
      title: t.paymentSuccessful,
      description: `${t.paymentId}: ${paymentId}`,
    });
    setShowPaymentForm(false);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: t.paymentFailed,
      description: error,
      variant: "destructive",
    });
  };

  const handleCancel = () => {
    setShowPaymentForm(false);
    toast({
      title: t.paymentCancelled,
      description: t.paymentCancelledDesc,
    });
  };

  if (showPaymentForm) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <MoyasarPayment
          amount={parseFloat(amount)}
          description={description}
          orderId="TEST-ORDER-001"
          customerName={customerName}
          customerPhone={customerPhone}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.moyasarPaymentTest}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount">{t.amount}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-testid="input-amount"
            />
          </div>

          <div>
            <Label htmlFor="description">{t.description}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-description"
            />
          </div>

          <div>
            <Label htmlFor="customerName">{t.customerName}</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              data-testid="input-customer-name"
            />
          </div>

          <div>
            <Label htmlFor="customerPhone">{t.customerPhone}</Label>
            <Input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              data-testid="input-customer-phone"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={() => setShowPaymentForm(true)}
              className="w-full"
              data-testid="button-show-payment-form"
            >
              {t.proceedToPayment}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">{t.testCardDetails}</h3>
            <div className="text-sm space-y-1">
              <p><strong>{t.cardNumber}:</strong> 4111 1111 1111 1111 (Visa)</p>
              <p><strong>{t.cardNumber}:</strong> 5200 0000 0000 0000 (Mastercard)</p>
              <p><strong>{t.expiry}:</strong> {t.anyFutureDate}</p>
              <p><strong>{t.cvv}:</strong> 123</p>
              <p><strong>{t.name}:</strong> {t.anyName}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
