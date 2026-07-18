"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ============================================
// Modal de Escolha de Método de Pagamento
// ============================================
const PaymentMethodModal = ({ open, plan, credits, amount, error, onConfirm, onClose }: {
  open: boolean;
  plan: string | null;
  credits: number;
  amount: number;
  error: string | null;
  onConfirm: (method: string) => void;
  onClose: () => void;
}) => {
  if (!open) return null;

  const methods = [
    { id: 'card_pix', label: 'Cartão / PIX', icon: '💳', desc: 'Pay with credit card or PIX' },
    { id: 'crypto', label: 'Cryptocurrency', icon: '₿', desc: 'Pay with Bitcoin, USDT & more' },
    { id: 'instant', label: 'Instant Credits (Test)', icon: '⚡', desc: 'Add credits instantly — free test' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1e] border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-2">Choose Payment Method</h3>
        <p className="text-white/50 mb-6">
          <span className="text-white font-semibold">{plan}</span> — {credits} credits
        </p>

        <div className="bg-[#141417] rounded-2xl p-4 mb-6 border border-white/5">
          <div className="flex justify-between">
            <span className="text-white/60">Amount</span>
            <span className="text-white font-bold">${(amount / 100).toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {methods.map(m => (
            <button
              key={m.id}
              onClick={() => onConfirm(m.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-[#141417] hover:border-[#ff7a00] hover:bg-[#ff7a00]/5 transition-all text-left group"
            >
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1">
                <div className="text-white font-semibold group-hover:text-[#ff7a00] transition-colors">{m.label}</div>
                <div className="text-white/40 text-sm">{m.desc}</div>
              </div>
              <span className="text-white/20 group-hover:text-[#ff7a00] transition-colors">→</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
        >
          Cancel
        </button>
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
const Navbar = ({ user, credits, creditsLoading, onLogin }: {
  user: any;
  credits: number | null;
  creditsLoading: boolean;
  onLogin: () => void;
}) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
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
            {/* Créditos - visível apenas logado */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
              <svg className="w-4 h-4 text-[#ff7a00]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13v4h-4v2h4v4h2v-4h4v-2h-4V7h-2z"/>
              </svg>
              <span className="text-sm font-semibold text-white">
                {creditsLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-[#ff7a00] border-t-transparent rounded-full animate-spin align-middle" />
                ) : (
                  credits ?? 0
                )}
              </span>
            </div>
            {/* Logout */}
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
  onBuy: (plan: string, credits: number, amount: number) => void;
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
      onClick={() => onBuy(plan, credits, parseInt(price) * 100)}
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; credits: number; amount: number } | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

  // Abrir modal de pagamento
  const handleBuy = (plan: string, planCredits: number, planAmount: number) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setSelectedPlan({ name: plan, credits: planCredits, amount: planAmount });
    setShowPaymentModal(true);
  };

  // Confirmar compra com método selecionado
  const handleConfirm = async (method: string) => {
    if (!selectedPlan || !user) return;
    setPaymentError(null);
    setPurchasing(true);

    try {
      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          plan: selectedPlan.name,
          credits: selectedPlan.credits,
          amount: selectedPlan.amount,
          payment_method: method,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPaymentError(data.error || 'Payment request failed');
        return;
      }

      if (data.direct) {
        // Instant/test mode — credits already added, just refresh
        setCredits(data.credits);
        setShowPaymentModal(false);
        setSelectedPlan(null);
      } else if (data.checkout_url) {
        // Open checkout in a new tab — don't redirect the current page
        window.open(data.checkout_url, '_blank');
        setShowPaymentModal(false);
        setSelectedPlan(null);
      }
    } catch (err) {
      console.error('Payment request failed:', err);
      setPaymentError('Network error — please try again');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] selection:bg-[#ff7a00]/30">
      {/* Navbar */}
      <Navbar
        user={user}
        credits={credits}
        creditsLoading={creditsLoading}
        onLogin={() => setShowLogin(true)}
      />

      {/* Modais */}
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      <PaymentMethodModal
        open={showPaymentModal}
        plan={selectedPlan?.name ?? null}
        credits={selectedPlan?.credits ?? 0}
        amount={selectedPlan?.amount ?? 0}
        error={paymentError}
        onConfirm={handleConfirm}
        onClose={() => { setShowPaymentModal(false); setSelectedPlan(null); setPaymentError(null); }}
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
