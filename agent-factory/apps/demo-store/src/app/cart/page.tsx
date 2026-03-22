'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  qty: number;
  imageUrl: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('af_cart');
    if (stored) setCart(JSON.parse(stored));
  }, []);

  const removeItem = () => {
    sessionStorage.removeItem('af_cart');
    setCart(null);
  };

  if (!cart) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-slate-500 mb-6">Your cart is empty</p>
        <Link href="/" className="btn-primary inline-block">Continue Shopping</Link>
      </main>
    );
  }

  const shipping = 5.99;
  const total = cart.price + shipping;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Items */}
        <div className="md:col-span-2 space-y-4">
          <div className="border border-slate-100 rounded-2xl p-4 flex gap-4">
            <div className="w-20 h-20 relative rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
              <Image src={cart.imageUrl} alt={cart.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">{cart.name}</h3>
              <p className="text-sm text-slate-500 mt-0.5">Size {cart.size}</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">${cart.price}</p>
            </div>
            <div className="flex flex-col items-end justify-between">
              <button
                onClick={removeItem}
                data-action="edit-cart"
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
              <div className="flex items-center gap-2">
                <button className="w-6 h-6 border border-slate-200 rounded-md flex items-center justify-center hover:bg-slate-50">
                  <Minus size={10} />
                </button>
                <span className="text-sm w-4 text-center">{cart.qty}</span>
                <button className="w-6 h-6 border border-slate-200 rounded-md flex items-center justify-center hover:bg-slate-50">
                  <Plus size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="border border-slate-100 rounded-2xl p-5 h-fit space-y-3">
          <h2 className="font-semibold text-slate-900">Order Summary</h2>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>${cart.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Shipping</span>
            <span>${shipping.toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between font-semibold text-slate-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Link href="/checkout" className="btn-primary w-full text-center block mt-2">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </main>
  );
}
