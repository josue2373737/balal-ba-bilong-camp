ALTER POLICY "Visitors can upload camp photos only" ON storage.objects WITH CHECK (
 bucket_id = 'camp-memories'
 AND name ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'
 AND (metadata->>'mimetype' IS NULL OR metadata->>'mimetype' IN ('image/jpeg', 'image/png', 'image/webp'))
 AND (metadata->>'size' IS NULL OR (metadata->>'size')::bigint BETWEEN 1 AND 10485760)
);