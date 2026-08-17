-- Guest uploads: anonymous visitors may only add files to the wedding bucket
CREATE POLICY "Guests can upload wedding media"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'wedding-media');

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Couple's own media browsing happens through trusted server code only.
CREATE POLICY "Admins can read wedding media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'wedding-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete wedding media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'wedding-media' AND public.has_role(auth.uid(), 'admin'));