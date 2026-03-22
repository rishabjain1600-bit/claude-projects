'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Package, Mail } from 'lucide-react';

export default function OrderConfirmationPage() {
  const [orderNumber] = useState(() => `SS-${Math.floor(Math.random() * 90000) + 10000}`);

  useEffect(() => {
    // Clear cart on confirmation
    sessionStorage.removeItem('af_cart');

    // Notify observer panel
    fetch('http://localhost:3000/api/observer/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerKey: 'demo-store-001',
        type: 'task_complete',
        sessionId: sessionStorage.getItem('__af_sid__') || '',
      }),
    }).catch(() => {});
  }, []);

  return (
    <main className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={32} className="text-emerald-600" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Order confirmed!</h1>
      <p className="text-slate-500 mb-1">Thank you for your order.</p>
      <p className="text-sm font-mono text-slate-400 mb-8">Order {orderNumber}</p>

      <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 mb-8 text-left">
        <div className="flex items-center gap-3 px-5 py-4">
          <Package size={16} className="text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-900">Shipping soon</p>
            <p className="text-xs text-slate-500">Estimated delivery: 3-5 business days</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-4">
          <Mail size={16} className="text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-900">Confirmation sent</p>
            <p className="text-xs text-slate-500">Check alex@example.com for your receipt</p>
          </div>
        </div>
      </div>

      <Link href="/" className="btn-secondary inline-block">
        Continue Shopping
      </Link>
    </main>
  );
}
