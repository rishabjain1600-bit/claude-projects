'use client';

import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertCircle, Zap, ChevronRight, Eye } from 'lucide-react';
import type { PatternSignal } from '@/lib/types';
import { getConfidenceLevel, isAgentReady, estimateMonthlyROI, THRESHOLDS } from '@/lib/data';
import { cn } from '@/lib/utils';

interface PatternCardProps {
  pattern: PatternSignal;
  index: number;
  onPreview: (pattern: PatternSignal) => void;
  onDeploy: (pattern: PatternSignal) => void;
  isDeployed?: boolean;
}

const SIGNAL_LABELS: Record<string, string> = {
  frequency: 'Frequency',
  consistency: 'Consistency',
  depth: 'Depth',
  friction: 'Friction',
  recurrence: 'Recurrence',
};

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  frequency: '% of sessions follow this path',
  consistency: 'How similar the paths are',
  depth: 'Number of steps in the pattern',
  friction: 'Abandon rate at drop-off step',
  recurrence: 'Times same user repeats this',
};

function SignalBar({ label, value, threshold, max = 1 }: {
  label: string;
  value: number;
  threshold: number;
  max?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const passes = value >= threshold;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={cn('font-mono font-medium', passes ? 'text-slate-200' : 'text-slate-500')}>
          {max === 1 ? `${Math.round(value * 100)}%` : value.toFixed(1)}
        </span>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className={cn('h-full rounded-full', passes ? 'bg-indigo-500' : 'bg-slate-700')}
        />
      </div>
    </div>
  );
}

export function PatternCard({ pattern, index, onPreview, onDeploy, isDeployed }: PatternCardProps) {
  const confidence = getConfidenceLevel(pattern.worthinessScore);
  const ready = isAgentReady(pattern);
  const roi = estimateMonthlyROI(pattern);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: ready ? 1 : 0.45, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        'card p-5 space-y-4 relative overflow-hidden',
        !ready && 'pointer-events-none'
      )}
    >
      {/* Deployed badge */}
      {isDeployed && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 pr-16">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          pattern.frictionType === 'process' ? 'bg-indigo-500/15' : 'bg-amber-500/15'
        )}>
          {pattern.frictionType === 'process'
            ? <Zap size={15} className="text-indigo-400" />
            : <Brain size={15} className="text-amber-400" />
          }
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-100 leading-tight">
              {patternDisplayName(pattern.patternKey)}
            </h3>
            <ConfidenceBadge level={confidence} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{pattern.inferredIntent}</p>
        </div>
      </div>

      {/* Key stats */}
      <div className="flex gap-4 text-xs">
        <div>
          <span className="text-slate-500">Sessions affected</span>
          <p className="text-slate-200 font-semibold mt-0.5">{Math.round(pattern.frequency * 100)}%</p>
        </div>
        <div>
          <span className="text-slate-500">Avg time stuck</span>
          <p className="text-slate-200 font-semibold mt-0.5">{pattern.avgTimeAtStepSeconds}s</p>
        </div>
        <div>
          <span className="text-slate-500">Est. recovery</span>
          <p className="text-emerald-400 font-semibold mt-0.5">{roi}</p>
        </div>
      </div>

      {/* Signal breakdown */}
      <div className="space-y-2.5 pt-1 border-t border-slate-800">
        <p className="text-xs text-slate-500 font-medium">Worthiness signals</p>
        <SignalBar label="Frequency" value={pattern.frequency} threshold={THRESHOLDS.frequency} />
        <SignalBar label="Consistency" value={pattern.consistency} threshold={THRESHOLDS.consistency} />
        <SignalBar label="Depth" value={pattern.depth} threshold={THRESHOLDS.depth} max={10} />
        <SignalBar label="Friction" value={pattern.friction} threshold={THRESHOLDS.friction} />
        <SignalBar label="Recurrence" value={pattern.recurrence} threshold={THRESHOLDS.recurrence} max={5} />
      </div>

      {/* Not ready message */}
      {!ready && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
          <AlertCircle size={12} />
          <span>Not yet agent-ready — needs more signal data</span>
        </div>
      )}

      {/* Actions */}
      {ready && !isDeployed && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => onPreview(pattern)} className="btn-ghost flex items-center gap-1.5 flex-1 justify-center">
            <Eye size={13} />
            Preview
          </button>
          <button onClick={() => onDeploy(pattern)} className="btn-primary flex items-center gap-1.5 flex-1 justify-center">
            Deploy
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Deployed — show stats */}
      {isDeployed && (
        <div className="flex gap-4 text-xs pt-1 border-t border-slate-800">
          <div>
            <span className="text-slate-500">Activations</span>
            <p className="text-slate-200 font-semibold mt-0.5">1</p>
          </div>
          <div>
            <span className="text-slate-500">Confirm rate</span>
            <p className="text-emerald-400 font-semibold mt-0.5">100%</p>
          </div>
          <div>
            <span className="text-slate-500">Rejections</span>
            <p className="text-slate-200 font-semibold mt-0.5">0</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  return (
    <span className={cn(
      level === 'high' && 'badge-high',
      level === 'medium' && 'badge-medium',
      level === 'low' && 'badge-low',
    )}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

function patternDisplayName(key: string): string {
  const names: Record<string, string> = {
    checkout_payment_idle: 'Checkout Payment Abandonment',
    product_return_visit: 'Product Consideration Loop',
    cart_quantity_loop: 'Cart Editing Friction',
  };
  return names[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
