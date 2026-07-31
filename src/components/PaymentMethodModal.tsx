"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

interface PaymentMethodModalProps {
  isOpen: boolean;
  planName: string;
  planCredits: number;
  planAmount: number; // in cents
  onClose: () => void;
}

type PaymentOption = 'fiat' | 'crypto' | 'telegram';

const OPTIONS: { id: PaymentOption; label: string; desc: string; icon: string; comingSoon?: boolean }[] = [
  {
    id: 'fiat',
    label: 'Credit Card / Bank Transfer / PIX',
    desc: 'Pay with card, bank transfer or PIX via Vexutopia',
    icon: '💳',
  },
  {
    id: 'crypto',
    label: 'Cryptocurrency',
    desc: 'Pay with Bitcoin, Ethereum, USDT and more',
    icon: '₿',
  },
  {
    id: 'telegram',
    label: 'Telegram Stars',
    desc: 'Pay using Telegram Stars',
    icon: '⭐',
  },
];

export default function PaymentMethodModal({
  isOpen,
  planName,
  planCredits,
  planAmount,
  onClose,
}: PaymentMethodModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSelect = async (option: PaymentOption) => {
    setLoading(true);
    setError(null);

    try {
      // Get auth session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('You must be logged in to make a purchase');
      }

      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: planName.toLowerCase(),
          credits: planCredits,
          amount: planAmount,
          payment_method: option,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = data.detail ? ` (${data.detail})` : '';
        throw new Error(`${data.error || 'Payment failed'}${detail}`);
      }

      if (data.direct) {
        toast(`Successfully added ${planCredits} credits!`, "success");
        onClose();
      } else if (data.checkout_url) {
        window.open(data.checkout_url, '_blank', 'noopener,noreferrer');
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#0A0B14] border border-[#1E2130] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#1E2130] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Choose Payment Method</h2>
            <p className="text-sm text-white/50 mt-1">
              {planName} • <span className="text-[#EE5F96] font-semibold">+{planCredits} credits</span>
              {planAmount > 0 && (
                <span className="text-white/40"> — ${(planAmount / 100).toFixed(2)}</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={loading || opt.comingSoon}
              className={`
                group relative flex items-center gap-4 p-4 rounded-2xl border transition-all text-left w-full
                ${opt.comingSoon
                  ? 'bg-[#161827] border-[#1E2130] opacity-50 cursor-not-allowed'
                  : loading
                    ? 'bg-[#161827] border-[#EE5F96] opacity-70 cursor-not-allowed'
                    : 'bg-[#161827] border-[#1E2130] hover:border-[#EE5F96]/50 hover:bg-[#1E2130]'}
              `}
            >
              <div className="w-12 h-12 rounded-full bg-[#0A0B14] flex items-center justify-center text-2xl border border-[#1E2130] group-hover:border-[#EE5F96]/50 transition-colors shrink-0">
                {opt.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">{opt.label}</span>
                  {opt.comingSoon && (
                    <span className="text-[10px] uppercase tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded-full font-semibold">
                      Soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-0.5">{opt.desc}</p>
              </div>

              {loading && (
                <div className="w-5 h-5 border-2 border-[#EE5F96] border-t-transparent rounded-full animate-spin shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#161827]/50 text-center">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
            Secure payments powered by Vexutopia
          </p>
        </div>
      </div>
    </div>
  );
}
