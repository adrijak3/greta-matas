DROP POLICY "Admins can read wedding media" ON storage.objects;
DROP POLICY "Admins can delete wedding media" ON storage.objects;

CREATE POLICY "Organisers can read wedding media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'wedding-media'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Organisers can delete wedding media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'wedding-media'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);