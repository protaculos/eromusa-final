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
    // Prime — glow rosa + efeito 3D
    'border-[#EE5F96] bg-[#1a1a1e] shadow-[0_0_40px_-5px_rgba(238,95,150,0.35)]',
  ];

  const checkBg = 'bg-[#EE5F96]/20';
  const checkColor = 'text-[#EE5F96]';

  return (
  <div className={`relative p-6 sm:p-8 rounded-3xl border flex flex-col h-full overflow-hidden transition-all duration-300 hover:scale-[1.02] ${tierStyles[tier]} ${tier === 3 ? 'prime-3d-card' : ''}`}>

    {tier === 3 && (
      <div className="absolute inset-0 pointer-events-none prime-3d-overlay" aria-hidden="true" />
    )}

    {tier >= 2 && tier < 3 && (
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(238,95,150,0.14)_0%,rgba(238,95,150,0.06)_22%,transparent_52%)]" aria-hidden="true" />
    )}

    {tier === 3 && (
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(238,95,150,0.18)_0%,rgba(238,95,150,0.08)_20%,transparent_50%),linear-gradient(135deg,rgba(238,95,150,0.06),rgba(255,255,255,0.02),rgba(238,95,150,0.1))]" aria-hidden="true" />
    )}

    {data.isPopular && tier !== 3 && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#EE5F96] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
        {t('pricing.mostPopular')}
      </div>
    )}
    {tier === 3 && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#EE5F96] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
        Premium
      </div>
    )}

    {/* Header */}
    <div className="relative z-10 mb-5 text-center">
      <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${tier >= 2 ? 'text-[#EE5F96]' : 'text-white'}`}>
        {data.plan}
      </h3>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl sm:text-5xl font-bold text-white">${data.price}</span>
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
      className="w-full py-4 rounded-xl font-bold text-lg sm:text-xl bg-[#EE5F96] text-white hover:bg-[#d94d7e] shadow-lg shadow-[#EE5F96]/20 transition-all"
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
      <style>{`
        .prime-3d-card { position: relative; }
        .prime-3d-overlay {
          background: linear-gradient(
            135deg,
            rgba(238, 95, 150, 0.08) 0%,
            rgba(139, 92, 246, 0.06) 25%,
            rgba(238, 95, 150, 0.10) 50%,
            rgba(59, 130, 246, 0.06) 75%,
            rgba(238, 95, 150, 0.08) 100%
          );
          background-size: 400% 400%;
          animation: prime-3d-shift 8s ease-in-out infinite;
        }
        @keyframes prime-3d-shift {
          0%   { background-position: 0% 0%; opacity: 0.7; }
          25%  { background-position: 100% 0%; opacity: 1; }
          50%  { background-position: 100% 100%; opacity: 0.7; }
          75%  { background-position: 0% 100%; opacity: 1; }
          100% { background-position: 0% 0%; opacity: 0.7; }
        }
      `}</style>
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      <PaymentMethodModal
        isOpen={showPaymentMethod}
        planName={selectedPlan?.name ?? ''}
        planCredits={selectedPlan?.credits ?? 0}
        planAmount={selectedPlan?.amount ?? 0}
        onClose={() => { setShowPaymentMethod(false); setSelectedPlan(null); }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10">
        <ErrorBoundary sectionName="Pricing">
        {/* Pricing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 sm:mt-12 lg:mt-16 mb-16 lg:mb-20">
          {PLANS.map((plan) => (
            <PricingCard key={plan.plan} data={plan} onBuy={handleBuy} />
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-2 lg:mt-4">
          <h2 className="text-3xl font-bold text-white text-center mb-8">{t('pricing.faq')}</h2>
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
