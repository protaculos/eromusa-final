-- ============================================
-- EroMusa - Tabelas de Planos e FAQ
-- ============================================

-- 1. Tabela de Planos de Preço
CREATE TABLE IF NOT EXISTS public.plans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE,
  button_text TEXT DEFAULT 'Get Started',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Features de cada Plano
CREATE TABLE IF NOT EXISTS public.plan_features (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de FAQ
CREATE TABLE IF NOT EXISTS public.faqs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Seed Data
-- ============================================

-- Planos
INSERT INTO public.plans (name, price, is_popular, button_text, sort_order) VALUES
  ('Basic', 0, FALSE, 'Get Started', 1),
  ('Plus', 19, TRUE, 'Get Started', 2),
  ('Prime', 49, FALSE, 'Get Started', 3);

-- Features do Basic
INSERT INTO public.plan_features (plan_id, feature, sort_order) VALUES
  (1, '10 Generations / day', 1),
  (1, 'Standard speed', 2),
  (1, 'Community support', 3),
  (1, 'Public gallery access', 4);

-- Features do Plus
INSERT INTO public.plan_features (plan_id, feature, sort_order) VALUES
  (2, '100 Generations / day', 1),
  (2, 'Fast speed', 2),
  (2, 'Priority support', 3),
  (2, 'Private gallery', 4),
  (2, 'Advanced settings', 5);

-- Features do Prime
INSERT INTO public.plan_features (plan_id, feature, sort_order) VALUES
  (3, 'Unlimited Generations', 1),
  (3, 'Ultra speed', 2),
  (3, 'Personal manager', 3),
  (3, 'API Access', 4),
  (3, 'Commercial license', 5);

-- FAQ
INSERT INTO public.faqs (question, answer, sort_order) VALUES
  ('Can I change my plan later?', 'Yes, you can upgrade or downgrade your plan at any time from your account settings. Changes will take effect immediately.', 1),
  ('How do the generation credits work?', 'Credits are refreshed daily for Basic and Plus plans. Prime users have unlimited access to our current generation models.', 2),
  ('What payment methods do you accept?', 'We accept all major credit cards and PayPal. All payments are processed securely through Stripe.', 3),
  ('Is there a free trial for Plus and Prime?', 'We offer a 7-day free trial for our Plus plan for new users to explore all the premium features.', 4);

-- ============================================
-- Permissões (Row Level Security)
-- ============================================
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode LER (anon key)
CREATE POLICY "Anyone can read plans" ON public.plans FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read plan_features" ON public.plan_features FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read faqs" ON public.faqs FOR SELECT USING (TRUE);
