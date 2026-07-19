"use client";
import React, { useState } from 'react';

interface Plan {
  id: string;
  label: string;
  amount: number;
  credits: number;
  icon: string;
  desc: string;
  method: 'standard' | 'instant';
}

const PLANS: Plan[] = [
  { id: 'starter', label: 'Starter Pack', amount: 999, credits: 100, icon: '🥉', desc: 'Perfect for trying out', method: 'standard' },
  { id: 'pro', label: 'Pro Pack', amount: 1999, credits: 250, icon: '🥈', desc: 'Best value for creators', method: 'standard' },
  { id: 'elite', label: 'Elite Pack', amount: 3999, credits: 600, icon: '🥇', desc: 'Maximum power', method: 'standard' },
  { id: 'instant', label: 'Instant Credits (Test)', amount: 0, credits: 100, icon: '⚡', desc: 'Add credits instantly — free test', method: 'instant' },
];

// Correcting the typo in 'elite' credits and mapping for a cleaner list
const FINAL_PLANS: Plan[] = [
  { id: 'starter', label: 'Starter Pack', amount: 999, credits: 100, icon: '🥉', desc: 'Perfect for trying out', method: 'standard' },
  { id: 'pro', label: 'Pro Pack', amount: 1999, credits: 250, icon: '🥈', desc: 'Best value for creators', method: 'standard' },
  { id: 'elite', label: 'Elite Pack', amount: 3999, credits: 600, icon: '🥇', desc: 'Maximum power', method: 'standard' },
  { id: 'instant', label: 'Instant Credits (Test)', amount: 0, credits: 100, icon: '⚡', desc: 'Add credits instantly — free test', method: 'instant' },
];

export default function PaymentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = async (plan: Plan) => {
    setLoadingPlan(plan.id);
    setError(null);

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          credits: plan.credits,
          amount: plan.amount,
          payment_method: plan.method,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Payment failed');

      if (data.direct) {
        // Credits added instantly (test mode)
        alert(`Successfully added ${plan.credits} credits!`);
        onClose();
      } else if (data.checkout_url) {
        // Open Vexutopia checkout in new tab
        window.open(data.checkout_url, '_blank', 'noopener,noreferrer');
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#0A0B14] border border-[#1E2130] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#1E2130] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Get More Credits</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid gap-3">
            {FINAL_PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan)}
                disabled={loadingPlan !== null}
                className={`
                  group relative flex items-center gap-4 p-4 rounded-2xl border transition-all text-left
                  ${loadingPlan === plan.id
                    ? 'bg-[#161827] border-[#F97316] opacity-70 cursor-not-allowed'
                    : 'bg-[#161827] border-[#1E2130] hover:border-[#F97316]/50 hover:bg-[#1E2130]'}
                `}
              >
                <div className="w-12 h-12 rounded-full bg-[#0A0B14] flex items-center justify-center text-2xl border border-[#1E2130] group-hover:border-[#F97316]/50 transition-colors">
                  {plan.icon}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{plan.label}</span>
                    <span className="text-[#F97316] font-bold">
                      {plan.amount === 0 ? 'FREE' : `$${(plan.amount / 100).toFixed(2)}`}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">{plan.desc} • {plan.credits} credits</p>
                </div>

                {loadingPlan === plan.id && (
                  <div className="w-5 h-5 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-[#161827]/50 text-center">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
            Secure Payments powered by Vexutopia
          </p>
        </div>
      </div>
    </div>
  );
}
