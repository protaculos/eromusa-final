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
  templates: string;       // ex: "10 (1/3)"
  totalVideos: number;     // quantos vídeos consegue fazer
  costPerVideo: string;   // custo por vídeo com desconto
  simultaneous: number;   // vídeos simultâneos
  queue: string;          // fila de prioridade
  isPopular?: boolean;
}

const PricingCard = ({ data, onBuy }: {
  data: PlanData;
  onBuy: (plan: string, credits: number, amount: number) => void;
}) => {
  const t = useT();
  return (
  <div className={`relative p-8 rounded-3xl border flex flex-col h-full transition-transform hover:scale-[1.02] ${
    data.isPopular ? 'border-[#EE5F96] bg-[#1a1a1e]' : 'border-white/10 bg-[#141417]'
  }`}>
    {data.isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#EE5F96] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
        {t('pricing.mostPopular')}
      </div>
    )}

    {/* Header */}
    <div className="mb-6">
      <h3 className="text-xl font-bold text-white mb-2">{data.plan}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold text-white">${data.price}</span>
      </div>
    </div>

    {/* Features */}
    <ul className="space-y-4 mb-8 flex-1">
      {/* 1. Créditos */}
      <li className="flex items-start gap-3 text-sm text-white/60">
        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#EE5F96]/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#EE5F96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span><strong className="text-white">{data.credits.toLocaleString()}</strong> {t('pricing.creditsPerMonth')}</span>
      </li>

      {/* 2. Templates */}
      <li className="flex items-start gap-3 text-sm text-white/60">
        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#EE5F96]/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#EE5F96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span><strong className="text-white">{data.templates}</strong> {t('pricing.videosOnDiscovery')}</span>
      </li>

      {/* 3. Vídeos que consegue fazer */}
      <li className="flex items-start gap-3 text-sm text-white/60">
        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#EE5F96]/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#EE5F96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span>{t('pricing.upTo')} <strong className="text-white">{data.totalVideos}</strong> {t('pricing.videosPerMonth')}</span>
      </li>

      {/* 4. Custo por vídeo */}
      <li className="flex items-start gap-3 text-sm text-white/60">
        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#EE5F96]/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#EE5F96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span>{t('pricing.just')} <strong className="text-white">${data.costPerVideo}</strong> {t('pricing.perVideo')}</span>
      </li>

      {/* 5. Vídeos simultâneos */}
      <li className="flex items-start gap-3 text-sm text-white/60">
        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#EE5F96]/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#EE5F96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span><strong className="text-white">{data.simultaneous}</strong> {t('pricing.simultaneousRenders')}</span>
      </li>

      {/* 6. Fila de prioridade */}
      <li className="flex items-start gap-3 text-sm text-white/60">
        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#EE5F96]/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#EE5F96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span><strong className="text-white">{data.queue}</strong> {t('pricing.priorityQueue')}</span>
      </li>
    </ul>

    {/* CTA */}
    <button
      onClick={() => onBuy(data.plan, data.credits, data.amount)}
      className={`w-full py-3 rounded-xl font-semibold transition-all ${
        data.isPopular
          ? 'bg-[#EE5F96] text-white hover:bg-[#d94d7e]'
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
    plan: 'Basic',
    price: '9.99',
    credits: 300,
    amount: 999,
    templates: '10 (1/3)',
    totalVideos: 10,
    costPerVideo: '1.00',
    simultaneous: 3,
    queue: 'Normal',
  },
  {
    plan: 'Plus',
    price: '29.99',
    credits: 1500,
    amount: 2999,
    templates: '20 (2/3)',
    totalVideos: 50,
    costPerVideo: '0.60',
    simultaneous: 10,
    queue: 'Alta',
    isPopular: true,
  },
  {
    plan: 'Prime',
    price: '49.99',
    credits: 3000,
    amount: 4999,
    templates: '30 (3/3)',
    totalVideos: 100,
    costPerVideo: '0.50',
    simultaneous: 15,
    queue: 'Elite',
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
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
