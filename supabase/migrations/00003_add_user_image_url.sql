-- ============================================
-- EroMusa - Adiciona user_image_url na tabela videos
-- ============================================

ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS user_image_url TEXT NOT NULL DEFAULT '';
