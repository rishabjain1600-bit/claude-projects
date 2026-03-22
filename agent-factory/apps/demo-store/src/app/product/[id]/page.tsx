'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, RotateCcw, Truck, Shield } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import type { Review } from '@/lib/products';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const product = PRODUCTS.find(p => p.id === id);
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  if (!product) {
    return <div className="p-8 text-center text-slate-500">Product not found</div>;
  }

  const handleAddToCart = () => {
    if (!selectedSize) return;
    // Store cart in sessionStorage
    const cart = { productId: product.id, size: selectedSize, qty: 1, price: product.price, name: product.name, imageUrl: product.imageUrl };
    sessionStorage.setItem('af_cart', JSON.stringify(cart));
    setAdded(true);
    setTimeout(() => router.push('/cart'), 600);
  };

  const avgRating = product.reviews?.length
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : null;

  return (
    <main
      className="max-w-5xl mx-auto px-6 py-10"
      data-af-product={product.name}
      data-af-price={String(product.price)}
      data-af-brand={product.brand}
      data-af-product-id={product.id}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
        <a href="/" className="hover:text-slate-600">Shop</a>
        <ChevronRight size={12} />
        <span className="text-slate-600">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="aspect-square relative overflow-hidden rounded-2xl bg-slate-50">
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <p className="text-sm text-slate-400 uppercase tracking-wide font-medium mb-2">{product.brand}</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
          <p className="text-2xl font-semibold text-slate-700 mb-6">${product.price}</p>

          <p className="text-slate-600 text-sm leading-relaxed mb-8">{product.description}</p>

          {/* Size selector */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-900">Select Size</span>
              {selectedSize && <span className="text-sm text-slate-500">Size {selectedSize} selected</span>}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {product.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  data-af-size={size}
                  className={`py-2.5 text-sm font-medium rounded-xl border transition-all ${
                    selectedSize === size
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            data-action="add-to-cart"
            className={`btn-primary mb-4 transition-all ${added ? 'bg-emerald-700' : ''} ${!selectedSize ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {added ? '✓ Added to cart' : selectedSize ? 'Add to Cart' : 'Select a Size'}
          </button>

          {/* Trust signals */}
          <div className="space-y-2.5 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <Truck size={14} className="text-slate-400" />
              Free shipping on orders over $75
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <RotateCcw size={14} className="text-slate-400" />
              Free returns within 30 days
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <Shield size={14} className="text-slate-400" />
              Secure checkout
            </div>
          </div>
        </div>
      </div>
      {/* Sizing Guide */}
      {product.sizingNotes && (
        <div data-af-context="sizing_guide" className="mt-12 pt-8 border-t border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Sizing Guide</h2>
          <div className="bg-slate-50 rounded-2xl p-6 text-sm text-slate-600 leading-relaxed">
            {product.sizingNotes}
          </div>
        </div>
      )}

      {/* Customer Reviews */}
      {product.reviews && product.reviews.length > 0 && (
        <div data-af-context="reviews" className="mt-10 pt-8 border-t border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Customer Reviews</h2>
          {avgRating && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-amber-400 text-lg">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
              <span className="text-sm text-slate-500">{avgRating.toFixed(1)} out of 5 ({product.reviews.length} reviews)</span>
            </div>
          )}
          <div className="space-y-6">
            {product.reviews.map((review: Review, i: number) => (
              <div key={i} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    <span className="font-medium text-slate-800 text-sm">{review.title}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-2 leading-relaxed">{review.body}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-medium">{review.author}</span>
                  {review.verified && <span className="text-emerald-600 font-medium">✓ Verified purchase</span>}
                  <span>{review.date}</span>
                  <span>{review.helpful} people found this helpful</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
