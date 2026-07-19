"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import LoginModal from '@/components/LoginModal';
import PaymentMethodModal from '@/components/PaymentMethodModal';

// ============================================
// Pricing Card
// ============================================
const PricingCard = ({ plan, price, features, credits, amount, isPopular = false, buttonText = "Get Started", onBuy }: {
  plan: string;
  price: string;
  features: string[];
  credits: number;
  amount: number;
  isPopular?: boolean;
  buttonText?: string;
  onBuy: (plan: string, credits: number, amount: number) => void;
}) => (
  <div className={`relative p-8 rounded-3xl border ${isPopular ? 'border-[#F97316] bg-[#1a1a1e]' : 'border-white/10 bg-[#141417]'} flex flex-col h-full transition-transform hover:scale-[1.02]`}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
        Most Popular
      </div>
    )}
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-2">{plan}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold text-white">${price}</span>
        <span className="text-white/40 text-sm">/month</span>
      </div>
    </div>
    <ul className="space-y-4 mb-8 flex-1">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-white/60">
          <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#F97316]/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {feature}
        </li>
      ))}
    </ul>
    <button
      onClick={() => onBuy(plan, credits, amount)}
      className={`w-full py-3 rounded-xl font-semibold transition-all ${isPopular ? 'bg-[#F97316] text-white hover:bg-[#e66d00]' : 'bg-white/10 text-white hover:bg-white/20'}`}
    >
      {buttonText}
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
// Página Principal
// ============================================
export default function PricingPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; credits: number; amount: number } | null>(null);

  // Abrir modal de escolha de pagamento
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
      {/* Navbar */}
      <Navbar />

      {/* Modais */}
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      <PaymentMethodModal
        isOpen={showPaymentMethod}
        planName={selectedPlan?.name ?? ''}
        planCredits={selectedPlan?.credits ?? 0}
        planAmount={selectedPlan?.amount ?? 0}
        onClose={() => { setShowPaymentMethod(false); setSelectedPlan(null); }}
      />

      <main className="max-w-7xl mx-auto px-6 py-20">
        {/* Hero Section */}
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
          <PricingCard
            plan="Basic"
            price="0"
            credits={10}
            amount={0}
            features={["10 Generations / day", "Standard speed", "Community support", "Public gallery access"]}
            onBuy={handleBuy}
          />
          <PricingCard
            plan="Plus"
            price="19"
            credits={100}
            amount={1900}
            isPopular={true}
            features={["100 Generations / day", "Fast speed", "Priority support", "Private gallery", "Advanced settings"]}
            onBuy={handleBuy}
          />
          <PricingCard
            plan="Prime"
            price="49"
            credits={1000}
            amount={4900}
            features={["Unlimited Generations", "Ultra speed", "Personal manager", "API Access", "Commercial license"]}
            onBuy={handleBuy}
          />
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="bg-[#141417] rounded-3xl p-8 border border-white/10">
            <FAQItem
              question="Can I change my plan later?"
              answer="Yes, you can upgrade or downgrade your plan at any time from your account settings. Changes will take effect immediately."
            />
            <FAQItem
              question="How do the generation credits work?"
              answer="Credits are refreshed daily for Basic and Plus plans. Prime users have unlimited access to our current generation models."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards and PayPal. All payments are processed securely through Stripe."
            />
            <FAQItem
              question="Is there a free trial for Plus and Prime?"
              answer="We offer a 7-day free trial for our Plus plan for new users to explore all the premium features."
            />
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-white/10 text-center text-white/30 text-sm">
        © {new Date().getFullYear()} EroMusa AI. All rights reserved.
      </footer>
    </div>
  );
}
