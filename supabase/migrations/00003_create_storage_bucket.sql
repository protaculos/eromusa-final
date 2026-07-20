-- ============================================
-- EroMusa - Bucket de Storage para imagens
-- ============================================

-- Cria o bucket "generations" para armazenar as imagens enviadas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generations',
  'generations',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer um pode ver imagens (são URLs públicas)
CREATE POLICY "Public can view generation images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generations');

-- Política: apenas service role pode fazer upload (via API route)
CREATE POLICY "Service role can upload generation images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'generations');
