-- ============================================
-- EroMusa - Tabela de Vídeos
-- ============================================

-- Tabela de vídeos (um por job de geração)
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_thumbnail TEXT NOT NULL,
  template_duration TEXT NOT NULL,
  template_credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  video_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_job_id ON public.videos(job_id);

-- Permissões (RLS)
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Usuário só vê seus próprios vídeos
CREATE POLICY "Users can view own videos"
  ON public.videos FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário só insere vídeos com seu próprio user_id
CREATE POLICY "Users can insert own videos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuário só atualiza seus próprios vídeos
CREATE POLICY "Users can update own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id);
