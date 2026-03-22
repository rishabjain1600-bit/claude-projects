'use client';

import { Zap, ExternalLink } from 'lucide-react';
import { ObserverPanel } from '@/components/ObserverPanel';
import { DEMO_CUSTOMER_KEY } from '@/lib/data';

export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-100">Agent Factory</span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">Sole Society Demo</span>
        </div>
        <a
          href="http://localhost:3001"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Open in new tab
          <ExternalLink size={11} />
        </a>
      </header>

      {/* Main: store iframe + observer */}
      <div className="flex flex-1 overflow-hidden">
        {/* Demo store */}
        <div className="flex-1 overflow-hidden bg-white">
          <iframe
            src="http://localhost:3001"
            className="w-full h-full border-0"
            title="Sole Society Demo Store"
          />
        </div>

        {/* Observer panel */}
        <div className="w-[420px] flex-shrink-0 border-l border-slate-800 overflow-hidden">
          <ObserverPanel customerKey={DEMO_CUSTOMER_KEY} />
        </div>
      </div>
    </div>
  );
}
