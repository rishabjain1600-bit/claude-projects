'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Brain, CheckCircle, Shield } from 'lucide-react';
import type { PatternSignal } from '@/lib/types';

interface PreviewModalProps {
  pattern: PatternSignal | null;
  onClose: () => void;
  onDeploy: (pattern: PatternSignal) => void;
}

const PATTERN_PREVIEWS: Record<string, {
  trigger: string;
  conversation: { role: 'agent' | 'user'; text: string }[];
  confirmation: { title: string; items: string[]; cta: string };
}> = {
  checkout_payment_idle: {
    trigger: 'User idle for 60+ seconds on the payment step',
    conversation: [
      {
        role: 'agent',
        text: "Looks like you've been on the payment step for a bit. It seems like you're trying to complete your Blue Sneakers order — want me to help wrap this up? I'll show you exactly what I'll do first.",
      },
      { role: 'user', text: 'Yes please' },
      {
        role: 'agent',
        text: "Here's my plan: I'll apply your saved card (ending 4242), keep your shipping to 123 Main St via Standard ($5.99). Total comes to $94.99. Shall I proceed?",
      },
    ],
    confirmation: {
      title: "Here's what I'll do",
      items: [
        'Apply saved card ending in 4242',
        'Ship to: 123 Main St, Standard shipping ($5.99)',
        'Order total: $94.99',
      ],
      cta: 'Confirm & Complete Order',
    },
  },
  product_return_visit: {
    trigger: 'Same user returns to a product page 3+ times without purchasing',
    conversation: [
      {
        role: 'agent',
        text: "I noticed you've come back to check out these sneakers a few times — is there something about them I can help clarify before you decide?",
      },
      { role: 'user', text: 'Do they run true to size?' },
      {
        role: 'agent',
        text: 'These run slightly narrow. Most people between sizes go up half a size. Also — free returns within 30 days, no questions asked. Want me to check if your size is in stock?',
      },
    ],
    confirmation: {
      title: "I'll check stock for you",
      items: ['Look up availability for your size', 'No purchase — information only'],
      cta: 'Check Stock',
    },
  },
};

export function PreviewModal({ pattern, onClose, onDeploy }: PreviewModalProps) {
  if (!pattern) return null;

  const preview = PATTERN_PREVIEWS[pattern.patternKey];
  if (!preview) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg card overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-500/15 flex items-center justify-center">
                {pattern.frictionType === 'process'
                  ? <Zap size={12} className="text-indigo-400" />
                  : <Brain size={12} className="text-amber-400" />
                }
              </div>
              <span className="text-sm font-semibold text-slate-200">Agent Preview</span>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Trigger */}
            <div className="bg-slate-800/50 rounded-lg px-4 py-3">
              <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Trigger condition</p>
              <p className="text-sm text-slate-300">{preview.trigger}</p>
            </div>

            {/* Simulated conversation */}
            <div>
              <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Simulated interaction</p>
              <div className="space-y-3">
                {preview.conversation.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'agent' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                        <span className="text-indigo-400 text-xs">A</span>
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === 'agent'
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-indigo-600 text-white'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation preview */}
            <div className="border border-slate-700 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-300">{preview.confirmation.title}</p>
              <ul className="space-y-1.5">
                {preview.confirmation.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle size={12} className="text-indigo-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <button className="flex-1 bg-indigo-600 text-white text-xs font-medium py-2 rounded-lg">
                  {preview.confirmation.cta}
                </button>
                <button className="text-xs text-slate-500 px-3">Not now</button>
              </div>
            </div>

            {/* Privacy note */}
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <Shield size={12} className="flex-shrink-0 mt-0.5 text-slate-600" />
              <span>Agent reads only what's visible on the page. No personal data stored or transmitted.</span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-800 flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button onClick={() => { onDeploy(pattern); onClose(); }} className="btn-primary flex-1">
              Deploy This Agent
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
