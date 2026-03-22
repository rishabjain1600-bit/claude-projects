'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Check } from 'lucide-react';

// Demo: pre-logged-in user with saved address and payment.
// The agent reads these values from the DOM via [data-af-saved] attributes.
const SAVED_USER = {
  name: 'Alex Johnson',
  email: 'alex@example.com',
  address: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  zip: '94107',
  cardLast4: '4242',
  cardExpiry: '09/27',
};

type Step = 'shipping' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('shipping');
  const [cart, setCart] = useState<{ name: string; price: number; size: string } | null>(null);
  const [shippingDone, setShippingDone] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('af_cart');
    if (stored) setCart(JSON.parse(stored));

    // Agent can update the cart size mid-session — re-read sessionStorage when it does
    const handleCartUpdate = () => {
      const updated = sessionStorage.getItem('af_cart');
      if (updated) setCart(JSON.parse(updated));
    };
    window.addEventListener('af:cart-updated', handleCartUpdate);
    return () => window.removeEventListener('af:cart-updated', handleCartUpdate);
  }, []);

  const shipping = 5.99;
  const total = (cart?.price || 0) + shipping;

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShippingDone(true);
    setStep('payment');
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/order-confirmation');
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-10" data-af-step={step}>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Checkout</h1>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        <span className={`font-medium ${step === 'shipping' ? 'text-slate-900' : 'text-emerald-600'}`}>
          {step !== 'shipping' && <Check size={14} className="inline mr-1" />}
          Shipping
        </span>
        <span className="text-slate-300">→</span>
        <span className={`font-medium ${step === 'payment' ? 'text-slate-900' : 'text-slate-400'}`}>
          Payment
        </span>
        <span className="text-slate-300">→</span>
        <span className="text-slate-400">Confirmation</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form */}
        <div className="md:col-span-2">
          {step === 'shipping' && (
            <form onSubmit={handleShippingSubmit} className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Shipping Information</h2>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  defaultValue={SAVED_USER.name}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  defaultValue={SAVED_USER.email}
                  required
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                <input
                  id="address"
                  type="text"
                  className="form-input"
                  defaultValue={SAVED_USER.address}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                  <input id="city" type="text" className="form-input" defaultValue={SAVED_USER.city} required />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                  <input id="state" type="text" className="form-input" defaultValue={SAVED_USER.state} required />
                </div>
                <div>
                  <label htmlFor="zip" className="block text-sm font-medium text-slate-700 mb-1.5">ZIP</label>
                  <input id="zip" type="text" className="form-input" defaultValue={SAVED_USER.zip} required />
                </div>
              </div>

              {/* Shipping method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Shipping Method</label>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                  <label className="flex items-center justify-between px-4 py-3 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="shipping" value="standard" defaultChecked className="accent-slate-900" />
                      <span className="text-sm text-slate-900">Standard (3-5 days)</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">$5.99</span>
                  </label>
                  <label className="flex items-center justify-between px-4 py-3 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="shipping" value="express" className="accent-slate-900" />
                      <span className="text-sm text-slate-900">Express (1-2 days)</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">$14.99</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full mt-2" data-step="shipping">
                Continue to Payment
              </button>
            </form>
          )}

          {step === 'payment' && (
            <form
              onSubmit={handlePlaceOrder}
              className="space-y-5"
              data-step="payment"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment</h2>

              {/* Saved card — this is what the agent reads from the DOM */}
              <div
                className="border border-indigo-200 bg-indigo-50/50 rounded-xl px-4 py-3 flex items-center justify-between"
                data-af-saved="saved_payment"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-5 bg-indigo-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Visa ending in {SAVED_USER.cardLast4}</p>
                    <p className="text-xs text-slate-500">Expires {SAVED_USER.cardExpiry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input type="radio" name="payment_method" value="saved" defaultChecked className="accent-indigo-600" />
                  <span className="text-xs text-indigo-600 font-medium">Saved</span>
                </div>
              </div>

              {/* Saved address summary */}
              <div
                className="border border-slate-100 bg-slate-50 rounded-xl px-4 py-3"
                data-af-saved="saved_address"
              >
                <p className="text-xs text-slate-500 font-medium mb-1">Shipping to</p>
                <p className="text-sm text-slate-900">{SAVED_USER.name}</p>
                <p className="text-sm text-slate-600">{SAVED_USER.address}, {SAVED_USER.city}, {SAVED_USER.state} {SAVED_USER.zip}</p>
                <p className="text-xs text-slate-500 mt-0.5">Standard shipping · $5.99</p>
              </div>

              {/* Or enter new card */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-slate-400">Or pay with new card</span>
                </div>
              </div>

              <div>
                <label htmlFor="card-number" className="block text-sm font-medium text-slate-700 mb-1.5">Card Number</label>
                <input
                  id="card-number"
                  type="text"
                  className="form-input"
                  placeholder="1234 5678 9012 3456"
                  autoComplete="cc-number"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="expiry" className="block text-sm font-medium text-slate-700 mb-1.5">Expiry</label>
                  <input id="expiry" type="text" className="form-input" placeholder="MM/YY" autoComplete="cc-exp" />
                </div>
                <div>
                  <label htmlFor="cvv" className="block text-sm font-medium text-slate-700 mb-1.5">CVV</label>
                  <input id="cvv" type="text" className="form-input" placeholder="•••" autoComplete="cc-csc" />
                </div>
              </div>

              {/* Security note */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield size={12} />
                Your payment info is encrypted and secure
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                data-af-submit="true"
              >
                Place Order · ${total.toFixed(2)}
              </button>
            </form>
          )}
        </div>

        {/* Order summary */}
        <div className="border border-slate-100 rounded-2xl p-5 h-fit space-y-3" data-af-order-summary="true">
          <h2 className="font-semibold text-slate-900">Order Summary</h2>
          {cart && (
            <div className="flex justify-between text-sm text-slate-600" data-af-size-display="true">
              <span>{cart.name} (Size {cart.size})</span>
              <span>${cart.price.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-slate-500">
            <span>Standard Shipping</span>
            <span>${shipping.toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between font-semibold text-slate-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
