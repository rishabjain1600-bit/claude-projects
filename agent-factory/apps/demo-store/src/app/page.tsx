import Image from 'next/image';
import Link from 'next/link';
import { PRODUCTS } from '@/lib/products';

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">New Arrivals</h1>
        <p className="text-slate-500">Premium sneakers for every style. Free returns within 30 days.</p>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map(product => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group block"
          >
            <div className="aspect-square relative overflow-hidden rounded-2xl bg-slate-50 mb-4">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">{product.brand}</p>
              <h2 className="font-semibold text-slate-900 group-hover:text-slate-600 transition-colors">{product.name}</h2>
              <p className="text-slate-500 text-sm mt-1">${product.price}</p>
              <div className="flex gap-1.5 mt-2">
                {product.tags.map(tag => (
                  <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Returns note */}
      <div className="mt-16 border-t border-slate-100 pt-8 text-center">
        <p className="text-sm text-slate-400">Free shipping on orders over $75 · Free returns within 30 days · Questions? We're here.</p>
      </div>
    </main>
  );
}
