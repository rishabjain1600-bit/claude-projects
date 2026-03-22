import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sole Society — Premium Sneakers',
  description: 'Discover premium sneakers for every style',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        {/* Nav */}
        <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-40">
          <a href="/" className="text-lg font-bold text-slate-900 tracking-tight">
            Sole Society
          </a>
          <div className="flex items-center gap-6">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Shop</a>
            <a href="/cart" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Cart</a>
          </div>
        </nav>

        {children}

        {/* Agent Factory tracking script — config is passed as URL params */}
        {/* key: customer identifier | idle: seconds before agent activates | debug: console logging */}
        <Script
          src="http://localhost:3000/track.js?key=demo-store-001&idle=5&debug=true"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
