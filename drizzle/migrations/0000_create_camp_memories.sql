CREATE TABLE public.camp_memories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 image_path text NOT NULL UNIQUE CHECK (image_path ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'),
 caption text NOT NULL DEFAULT 'Souvenir du camp' CHECK (char_length(btrim(caption)) BETWEEN 1 AND 200),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.camp_memories TO anon, authenticated;
GRANT ALL ON public.camp_memories TO service_role;
ALTER TABLE public.camp_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view camp memories" ON public.camp_memories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Visitors can share an uploaded camp photo" ON public.camp_memories FOR INSERT TO anon, authenticated WITH CHECK (
 EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'camp-memories' AND name = image_path)
);
CREATE INDEX camp_memories_created_idx ON public.camp_memories (created_at DESC);
CREATE POLICY "Visitors can read shared camp photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'camp-memories');
CREATE POLICY "Visitors can upload camp photos only" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (
 bucket_id = 'camp-memories'
 AND name ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'
 AND metadata->>'mimetype' IN ('image/jpeg', 'image/png', 'image/webp')
 AND (metadata->>'size')::bigint BETWEEN 1 AND 10485760
);