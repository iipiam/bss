import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoyasarPayment } from "@/components/MoyasarPayment";
import { useToast } from "@/hooks/use-toast";

export default function PaymentTest() {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [amount, setAmount] = useState("100.00");
  const [description, setDescription] = useState("Test Order Payment");
  const [customerName, setCustomerName] = useState("Test Customer");
  const [customerPhone, setCustomerPhone] = useState("+966500000000");
  const { toast } = useToast();

  const handlePaymentSuccess = (paymentId: string) => {
    toast({
      title: "Payment Successful",
      description: `Payment ID: ${paymentId}`,
    });
    setShowPaymentForm(false);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleCancel = () => {
    setShowPaymentForm(false);
    toast({
      title: "Payment Cancelled",
      description: "Payment process was cancelled",
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
          <CardTitle>Moyasar Payment Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (SAR)</Label>
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
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-description"
            />
          </div>

          <div>
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              data-testid="input-customer-name"
            />
          </div>

          <div>
            <Label htmlFor="customerPhone">Customer Phone</Label>
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
              Proceed to Payment
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Test Card Details</h3>
            <div className="text-sm space-y-1">
              <p><strong>Card Number:</strong> 4111 1111 1111 1111 (Visa)</p>
              <p><strong>Card Number:</strong> 5200 0000 0000 0000 (Mastercard)</p>
              <p><strong>Expiry:</strong> Any future date (e.g., 12/25)</p>
              <p><strong>CVV:</strong> 123</p>
              <p><strong>Name:</strong> Any name</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
