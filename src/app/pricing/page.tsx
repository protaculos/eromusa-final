"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/i18n/useT';
import LoginModal from '@/components/LoginModal';
import PaymentMethodModal from '@/components/PaymentMethodModal';
import ErrorBoundary from '@/components/ErrorBoundary';

// ============================================
// Pricing Card
// ============================================
interface PlanData {
  plan: string;
  price: string;
  credits: number;
  amount: number;
  totalVideos: number;
  costPerVideo: string;
  tier?: number; // 0=starter, 1=basic, 2=plus, 3=prime
  isPopular?: boolean;
}

const PricingCard = ({ data, onBuy }: {
  data: PlanData;
  onBuy: (plan: string, credits: number, amount: number) => void;
}) => {
  const t = useT();
  const tier = data.tier ?? 0;

  const tierStyles = [
    // Starter — clean
    'border-white/10 bg-[#141417]',
    // Basic — borda sutil
    'border-white/15 bg-[#141417]',
    // Plus — glow rosa
    'border-[#EE5F96] bg-[#1a1a1e] shadow-[0_0_30px_-5px_rgba(238,95,150,0.25)]',
    // Prime — glow dourado
    'border-yellow-500/50 bg-gradient-to-b from-[#1f1d15] to-[#141417] shadow-[0_0_40px_-5px_rgba(234,179,8,0.3)]',
  ];

  const checkBg = tier === 3 ? 'bg-yellow-500/20' : 'bg-[#EE5F96]/20';
  const checkColor = tier === 3 ? 'text-yellow-400' : 'text-[#EE5F96]';

  return (
  <div className={`relative p-6 sm:p-8 rounded-3xl border flex flex-col h-full transition-all duration-300 hover:scale-[1.02] ${tierStyles[tier]}`}>

    {data.isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#EE5F96] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
        {t('pricing.mostPopular')}
      </div>
    )}
    {tier === 3 && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
        Premium
      </div>
    )}

    {/* Header */}
    <div className="mb-5 text-center">
      <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${tier === 3 ? 'text-yellow-300' : tier === 2 ? 'text-[#EE5F96]' : 'text-white'}`}>
        {data.plan}
      </h3>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-5xl sm:text-6xl font-extrabold text-white">${data.price}</span>
      </div>
    </div>

    {/* Features */}
    <ul className="space-y-4 sm:space-y-5 mb-8 flex-1 border-t border-white/10 pt-5">
      <li className="flex items-center gap-3 text-base sm:text-lg text-white/70">
        <div className={`flex-shrink-0 w-5 h-5 rounded-full ${checkBg} flex items-center justify-center`}>
          <svg className={`w-3 h-3 ${checkColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span><strong className="text-white font-bold">{data.credits.toLocaleString()}</strong> {t('pricing.credits')}</span>
      </li>

      <li className="flex items-center gap-3 text-base sm:text-lg text-white/70">
        <div className={`flex-shrink-0 w-5 h-5 rounded-full ${checkBg} flex items-center justify-center`}>
          <svg className={`w-3 h-3 ${checkColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span>{t('pricing.createXVideos').replace('{count}', String(data.totalVideos))}</span>
      </li>

      <li className="flex items-center gap-3 text-base sm:text-lg text-white/70">
        <div className={`flex-shrink-0 w-5 h-5 rounded-full ${checkBg} flex items-center justify-center`}>
          <svg className={`w-3 h-3 ${checkColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span>1 vídeo = <strong className="text-white font-bold">${data.costPerVideo}</strong></span>
      </li>
    </ul>

    {/* CTA */}
    <button
      onClick={() => onBuy(data.plan, data.credits, data.amount)}
      className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all ${
        tier === 3
          ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500 shadow-lg shadow-yellow-500/20'
          : tier === 2
            ? 'bg-[#EE5F96] text-white hover:bg-[#d94d7e] shadow-lg shadow-[#EE5F96]/20'
            : 'bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      {t('pricing.getStarted')}
    </button>
  </div>
  );
};

// ============================================
// FAQ Item
// ============================================
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full py-6 flex items-center justify-between text-left text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#EE5F96]/50 rounded-lg"
      >
        <span className="text-lg font-medium">{question}</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}
        role="region"
      >
        <p className="text-white/50 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

// ============================================
// Dados dos Planos
// ============================================
const PLANS: PlanData[] = [
  {
    plan: 'Starter',
    price: '2.99',
    credits: 60,
    amount: 299,
    totalVideos: 2,
    costPerVideo: '1.50',
    tier: 0,
  },
  {
    plan: 'Basic',
    price: '9.99',
    credits: 300,
    amount: 999,
    totalVideos: 10,
    costPerVideo: '1.00',
    tier: 1,
  },
  {
    plan: 'Plus',
    price: '29.99',
    credits: 1500,
    amount: 2999,
    totalVideos: 50,
    costPerVideo: '0.60',
    tier: 2,
    isPopular: true,
  },
  {
    plan: 'Prime',
    price: '49.99',
    credits: 3000,
    amount: 4999,
    totalVideos: 100,
    costPerVideo: '0.50',
    tier: 3,
  },
];

// ============================================
// Página Principal
// ============================================
export default function PricingPage() {
  const { user } = useAuth();
  const t = useT();
  const [showLogin, setShowLogin] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; credits: number; amount: number } | null>(null);

  const handleBuy = (plan: string, planCredits: number, planAmount: number) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setSelectedPlan({ name: plan, credits: planCredits, amount: planAmount });
    setShowPaymentMethod(true);
  };

  return (
    <div className="min-h-screen selection:bg-[#EE5F96]/30">
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      <PaymentMethodModal
        isOpen={showPaymentMethod}
        planName={selectedPlan?.name ?? ''}
        planCredits={selectedPlan?.credits ?? 0}
        planAmount={selectedPlan?.amount ?? 0}
        onClose={() => { setShowPaymentMethod(false); setSelectedPlan(null); }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <ErrorBoundary sectionName="Pricing">
        {/* Pricing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
          {PLANS.map((plan) => (
            <PricingCard key={plan.plan} data={plan} onBuy={handleBuy} />
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">{t('pricing.faq')}</h2>
          <div className="bg-[#141417] rounded-3xl p-8 border border-white/10">
            <FAQItem
              question={t('pricing.faq1q')}
              answer={t('pricing.faq1a')}
            />
            <FAQItem
              question={t('pricing.faq2q')}
              answer={t('pricing.faq2a')}
            />
            <FAQItem
              question={t('pricing.faq3q')}
              answer={t('pricing.faq3a')}
            />
            <FAQItem
              question={t('pricing.faq4q')}
              answer={t('pricing.faq4a')}
            />
          </div>
        </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}
