import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import Modal from './Modal';

interface PaymentGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentRef: string) => void;
  amount: number;
  currency: string;
  description: string;
  applicantEmail: string;
  applicantName: string;
  schoolId: string;
  applicationId: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  logo: string;
  type: 'card' | 'bank' | 'mobile' | 'crypto';
  enabled: boolean;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  currency,
  description,
  applicantEmail,
  applicantName,
  schoolId,
  applicationId
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    // In a real implementation, this would come from your payment gateway configuration
    const methods: PaymentMethod[] = [
      {
        id: 'paystack',
        name: 'Paystack',
        logo: '/payment-logos/paystack.png',
        type: 'card',
        enabled: true
      },
      {
        id: 'flutterwave',
        name: 'Flutterwave',
        logo: '/payment-logos/flutterwave.png',
        type: 'card',
        enabled: true
      },
      {
        id: 'stripe',
        name: 'Stripe',
        logo: '/payment-logos/stripe.png',
        type: 'card',
        enabled: true
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        logo: '/payment-logos/bank.png',
        type: 'bank',
        enabled: true
      },
      {
        id: 'ussd',
        name: 'USSD (*737#)',
        logo: '/payment-logos/ussd.png',
        type: 'mobile',
        enabled: true
      },
      {
        id: 'mobile_money',
        name: 'Mobile Money',
        logo: '/payment-logos/mobile-money.png',
        type: 'mobile',
        enabled: true
      }
    ];
    setPaymentMethods(methods.filter(m => m.enabled));
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }

    setProcessing(true);

    try {
      // Create payment record
      const paymentData = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        application_id: applicationId,
        school_id: schoolId,
        amount,
        currency,
        payment_method: selectedMethod,
        status: 'pending',
        applicant_email: applicantEmail,
        applicant_name: applicantName,
        description,
        created_at: new Date().toISOString()
      };

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([paymentData]);

      if (paymentError) throw paymentError;

      // Process payment based on selected method
      let paymentResult;
      switch (selectedMethod) {
        case 'paystack':
          paymentResult = await processPaystackPayment(paymentData);
          break;
        case 'flutterwave':
          paymentResult = await processFlutterwavePayment(paymentData);
          break;
        case 'stripe':
          paymentResult = await processStripePayment(paymentData);
          break;
        case 'bank_transfer':
          paymentResult = await processBankTransfer(paymentData);
          break;
        case 'ussd':
          paymentResult = await processUSSDPayment(paymentData);
          break;
        case 'mobile_money':
          paymentResult = await processMobileMoneyPayment(paymentData);
          break;
        default:
          throw new Error('Invalid payment method');
      }

      if (paymentResult.success) {
        // Update payment status
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            payment_reference: paymentResult.reference,
            completed_at: new Date().toISOString()
          })
          .eq('id', paymentData.id);

        // Update application status
        await supabase
          .from('admission_applications')
          .update({
            payment_status: 'paid',
            payment_reference: paymentResult.reference
          })
          .eq('id', applicationId);

        onSuccess(paymentResult.reference);
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const processPaystackPayment = async (paymentData: any) => {
    // Simulate Paystack integration
    return new Promise<{ success: boolean; reference?: string; error?: string }>((resolve) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate for demo
          resolve({
            success: true,
            reference: `PSK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
        } else {
          resolve({
            success: false,
            error: 'Payment declined by bank'
          });
        }
      }, 3000);
    });
  };

  const processFlutterwavePayment = async (paymentData: any) => {
    // Simulate Flutterwave integration
    return new Promise<{ success: boolean; reference?: string; error?: string }>((resolve) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {
          resolve({
            success: true,
            reference: `FLW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
        } else {
          resolve({
            success: false,
            error: 'Insufficient funds'
          });
        }
      }, 2500);
    });
  };

  const processStripePayment = async (paymentData: any) => {
    // Simulate Stripe integration
    return new Promise<{ success: boolean; reference?: string; error?: string }>((resolve) => {
      setTimeout(() => {
        if (Math.random() > 0.05) {
          resolve({
            success: true,
            reference: `STR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
        } else {
          resolve({
            success: false,
            error: 'Card expired'
          });
        }
      }, 2000);
    });
  };

  const processBankTransfer = async (paymentData: any) => {
    // For bank transfer, we just generate instructions
    return {
      success: true,
      reference: `BNK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  };

  const processUSSDPayment = async (paymentData: any) => {
    // Generate USSD code
    return {
      success: true,
      reference: `USD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  };

  const processMobileMoneyPayment = async (paymentData: any) => {
    // Simulate mobile money
    return new Promise<{ success: boolean; reference?: string; error?: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          reference: `MOB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
      }, 4000);
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment" size="lg">
      <div className="p-6">
        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-lg mb-2">Payment Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Description:</span>
              <span>{description}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-bold text-green-600">{formatAmount(amount, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Applicant:</span>
              <span>{applicantName}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <h4 className="font-semibold mb-4">Select Payment Method</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 border rounded-lg flex items-center space-x-3 transition-colors ${
                  selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold">{method.name.slice(0, 3).toUpperCase()}</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{method.name}</div>
                  <div className="text-sm text-gray-500 capitalize">{method.type}</div>
                </div>
                {selectedMethod === method.id && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Card Details Form (for card payments) */}
        {selectedMethod && ['paystack', 'flutterwave', 'stripe'].includes(selectedMethod) && (
          <div className="mb-6">
            <h4 className="font-semibold mb-4">Card Details</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <input
                  type="text"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="text"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <input
                    type="text"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                <input
                  type="text"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bank Transfer Instructions */}
        {selectedMethod === 'bank_transfer' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Bank Transfer Instructions</h4>
            <div className="text-sm space-y-1">
              <p><strong>Bank:</strong> First Bank of Nigeria</p>
              <p><strong>Account Name:</strong> School Admissions</p>
              <p><strong>Account Number:</strong> 1234567890</p>
              <p><strong>Amount:</strong> {formatAmount(amount, currency)}</p>
              <p><strong>Reference:</strong> {applicationId}</p>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Please use the reference number when making the transfer and upload proof of payment.
            </p>
          </div>
        )}

        {/* USSD Instructions */}
        {selectedMethod === 'ussd' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">USSD Payment</h4>
            <div className="text-sm space-y-2">
              <p>Dial <strong>*737*50*{amount}*{applicationId}#</strong> from your registered phone number</p>
              <p>Follow the prompts to complete the payment</p>
              <p>You will receive an SMS confirmation upon successful payment</p>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 text-green-500 mt-0.5">🔒</div>
            <div className="text-sm">
              <p className="font-medium">Secure Payment</p>
              <p className="text-gray-600">Your payment information is encrypted and secure. We do not store your card details.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={!selectedMethod || processing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {processing && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{processing ? 'Processing...' : `Pay ${formatAmount(amount, currency)}`}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentGateway;
