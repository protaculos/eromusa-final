"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ============================================
// Modal de Confirmação
// ============================================
const ConfirmModal = ({ open, plan, credits, onConfirm, onClose }: {
  open: boolean;
  plan: string | null;
  credits: number;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1e] border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-2">Confirm Purchase</h3>
        <p className="text-white/50 mb-6">
          You are about to purchase the <span className="text-white font-semibold">{plan}</span> plan.
        </p>

        <div className="bg-[#141417] rounded-2xl p-5 mb-6 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm">Plan</span>
            <span className="text-white font-medium">{plan}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Credits</span>
            <span className="text-[#ff7a00] font-bold text-lg">+{credits}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-semibold bg-[#ff7a00] text-white hover:bg-[#e66d00] transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Modal de Login
// ============================================
const LoginModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account created! Check your email to confirm.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1e] border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-[#141417] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#ff7a00] transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl bg-[#141417] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#ff7a00] transition-colors"
          />

          {message && (
            <p className="text-sm text-white/60 bg-white/5 rounded-xl px-4 py-3">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold bg-[#ff7a00] text-white hover:bg-[#e66d00] disabled:opacity-50 transition-all"
          >
            {loading ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-4">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setMessage(''); }}
            className="text-[#ff7a00] hover:underline"
          >
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

// ============================================
// Navbar
// ============================================
const Navbar = ({ credits, creditsLoading, onLogin }: {
  credits: number | null;
  creditsLoading: boolean;
  onLogin: () => void;
}) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full text-white/80">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold text-white">
          Ero<span className="text-[#ff7a00]">Musa</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="#" className="hover:text-white transition-colors">Discover</Link>
          <Link href="#" className="hover:text-white transition-colors">Gallery</Link>
          <Link href="#" className="text-white underline underline-offset-4 decoration-[#ff7a00]">Pricing</Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="hidden sm:block text-sm font-medium text-white/60">
              Credits: <span className="text-white">{creditsLoading ? '...' : credits ?? 0}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={onLogin}
            className="text-sm font-medium hover:text-white transition-colors"
          >
            Sign In
          </button>
        )}
        <Link href="#" className="bg-[#ff7a00] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#e66d00] transition-colors">
          Upgrade
        </Link>
      </div>
    </nav>
  );
};

// ============================================
// Pricing Card
// ============================================
const PricingCard = ({ plan, price, features, credits, isPopular = false, buttonText = "Get Started", onBuy }: {
  plan: string;
  price: string;
  features: string[];
  credits: number;
  isPopular?: boolean;
  buttonText?: string;
  onBuy: (plan: string, credits: number) => void;
}) => (
  <div className={`relative p-8 rounded-3xl border ${isPopular ? 'border-[#ff7a00] bg-[#1a1a1e]' : 'border-white/10 bg-[#141417]'} flex flex-col h-full transition-transform hover:scale-[1.02]`}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#ff7a00] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
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
          <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#ff7a00]/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-[#ff7a00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {feature}
        </li>
      ))}
    </ul>
    <button
      onClick={() => onBuy(plan, credits)}
      className={`w-full py-3 rounded-xl font-semibold transition-all ${isPopular ? 'bg-[#ff7a00] text-white hover:bg-[#e66d00]' : 'bg-white/10 text-white hover:bg-white/20'}`}
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
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Modal states
  const [showLogin, setShowLogin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; credits: number } | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  // Carregar usuário e créditos
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();

        if (data) setCredits(data.credits);
      }
      setCreditsLoading(false);
    }

    load();

    // Escutar mudanças de auth (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', session.user.id)
          .single();
        if (data) setCredits(data.credits);
      } else {
        setCredits(null);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  // Abrir modal de confirmação
  const handleBuy = (plan: string, planCredits: number) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setSelectedPlan({ name: plan, credits: planCredits });
    setShowConfirm(true);
  };

  // Confirmar compra
  const handleConfirm = async () => {
    if (!selectedPlan || !user) return;
    setPurchasing(true);

    const newCredits = (credits ?? 0) + selectedPlan.credits;

    const { error } = await supabase
      .from('profiles')
      .update({ credits: newCredits, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!error) {
      setCredits(newCredits);
    }

    setPurchasing(false);
    setShowConfirm(false);
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] selection:bg-[#ff7a00]/30">
      {/* Navbar */}
      <Navbar
        credits={credits}
        creditsLoading={creditsLoading}
        onLogin={() => setShowLogin(true)}
      />

      {/* Modais */}
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      <ConfirmModal
        open={showConfirm}
        plan={selectedPlan?.name ?? null}
        credits={selectedPlan?.credits ?? 0}
        onConfirm={handleConfirm}
        onClose={() => { setShowConfirm(false); setSelectedPlan(null); }}
      />

      {/* Loading overlay durante compra */}
      {purchasing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 bg-[#1a1a1e] border border-white/10 rounded-2xl px-6 py-4">
            <div className="w-5 h-5 border-2 border-[#ff7a00] border-t-transparent rounded-full animate-spin" />
            <span className="text-white/80 text-sm">Processing...</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Simple, transparent <br />
            <span className="text-[#ff7a00]">pricing plans</span>
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
            features={["10 Generations / day", "Standard speed", "Community support", "Public gallery access"]}
            onBuy={handleBuy}
          />
          <PricingCard
            plan="Plus"
            price="19"
            credits={100}
            isPopular={true}
            features={["100 Generations / day", "Fast speed", "Priority support", "Private gallery", "Advanced settings"]}
            onBuy={handleBuy}
          />
          <PricingCard
            plan="Prime"
            price="49"
            credits={1000}
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
