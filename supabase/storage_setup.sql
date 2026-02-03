-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Authenticated users to upload files
-- We target the 'incident-photos' bucket specifically
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'incident-photos');

-- 3. Allow Public to view files (since it's a public bucket)
CREATE POLICY "Allow public select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'incident-photos');

-- 4. Allow Authenticated users to update/delete their own uploads (Optional but good)
CREATE POLICY "Allow authenticated full access"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'incident-photos')
WITH CHECK (bucket_id = 'incident-photos');
