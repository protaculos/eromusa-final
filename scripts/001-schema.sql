-- ============================================
-- Migration 001: Admin + Categories + Scenes
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Adicionar coluna role na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin'));

-- 2. Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de cenas
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER DEFAULT 10,
  style_id TEXT NOT NULL,
  loop_video_url TEXT NOT NULL,
  gradient TEXT DEFAULT 'from-orange-500 via-pink-500 to-purple-600',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de junção (N:N) — cena pode estar em várias categorias
CREATE TABLE IF NOT EXISTS category_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  "order" INTEGER DEFAULT 0,
  UNIQUE(category_id, scene_id)
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_category_scenes_category ON category_scenes(category_id);
CREATE INDEX IF NOT EXISTS idx_category_scenes_scene ON category_scenes(scene_id);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories("order");
CREATE INDEX IF NOT EXISTS idx_scenes_name ON scenes(name);

-- 6. Bucket scene-videos (criar manualmente no Supabase Dashboard:
--    Storage → Create bucket → name: scene-videos → Public bucket)
--    Depois adicionar política de leitura pública:
--    CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'scene-videos');

-- 7. Tabela de exemplos por cena
CREATE TABLE IF NOT EXISTS scene_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  name TEXT DEFAULT '',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scene_examples_scene ON scene_examples(scene_id);
