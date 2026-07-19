"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import LoginModal from '@/components/LoginModal';
import PaymentMethodModal from '@/components/PaymentMethodModal';

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
}) => (
  <div className={`relative p-8 rounded-3xl border flex flex-col h-full transition-transform hover:scale-[1.02] ${
    data.isPopular ? 'border-[#F97316] bg-[#1a1a1e]' : 'border-white/10 bg-[#141417]'
  }`}>
    {data.isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
        Most Popular
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
        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#F97316]/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span><strong className="text-white">{data.credits.toLocaleString()}</strong> credits per month</span>
      </li>

      {/* 2. Templates */}
      <li className="flex items-start gap-3 text-sm text-white/60">
        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#F97316]/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span><strong className="text-white">{data.templates}</strong> videos on Discovery</span>
      </li>

      {/* 3. Vídeos que consegue fazer */}
      <li className="flex items-start gap-3 text-sm text-white/60">
        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#F97316]/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span>Up to <strong className="text-white">{data.totalVideos}</strong> videos per month</span>
      </li>

      {/* 4. Custo por vídeo */}
      <li className="flex items-start gap-3 text-sm text-white/60">
        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#F97316]/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span>Just <strong className="text-white">${data.costPerVideo}/video</strong> with package discount</span>
      </li>

      {/* 5. Vídeos simultâneos */}
      <li className="flex items-start gap-3 text-sm text-white/60">
        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#F97316]/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span><strong className="text-white">{data.simultaneous}</strong> simultaneous renders</span>
      </li>

      {/* 6. Fila de prioridade */}
      <li className="flex items-start gap-3 text-sm text-white/60">
        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#F97316]/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span><strong className="text-white">{data.queue}</strong> priority queue</span>
      </li>
    </ul>

    {/* CTA */}
    <button
      onClick={() => onBuy(data.plan, data.credits, data.amount)}
      className={`w-full py-3 rounded-xl font-semibold transition-all ${
        data.isPopular
          ? 'bg-[#F97316] text-white hover:bg-[#e66d00]'
          : 'bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      Get Started
    </button>
  </div>
);

// ============================================
// FAQ Item
// ============================================
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left text-white/80 hover:text-white transition-colors"
      >
        <span className="text-lg font-medium">{question}</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
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
    <div className="min-h-screen bg-[#0a0a0b] selection:bg-[#F97316]/30">
      <Navbar />

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      <PaymentMethodModal
        isOpen={showPaymentMethod}
        planName={selectedPlan?.name ?? ''}
        planCredits={selectedPlan?.credits ?? 0}
        planAmount={selectedPlan?.amount ?? 0}
        onClose={() => { setShowPaymentMethod(false); setSelectedPlan(null); }}
      />

      <main className="max-w-7xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Simple, transparent <br />
            <span className="text-[#F97316]">pricing plans</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Choose the plan that best fits your needs. From hobbyists to professionals,
            we have a plan for everyone.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {PLANS.map((plan) => (
            <PricingCard key={plan.plan} data={plan} onBuy={handleBuy} />
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="bg-[#141417] rounded-3xl p-8 border border-white/10">
            <FAQItem
              question="Can I change my plan later?"
              answer="Yes, you can upgrade or downgrade your plan at any time from your account settings. Changes will take effect immediately."
            />
            <FAQItem
              question="How do the generation credits work?"
              answer="Each video generation costs 30 credits (standard) or 60 credits (premium). Your credits reset every month on your billing date."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept credit cards, bank transfers, and PIX through our secure payment partner Vexutopia."
            />
            <FAQItem
              question="Is there a free trial for Plus and Prime?"
              answer="We offer a 7-day free trial for our Plus plan for new users to explore all the premium features."
            />
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-white/10 text-white/40 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} EroMusa AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            <Link href="/terms-of-use" className="hover:text-white transition-colors">Terms of Use</Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
