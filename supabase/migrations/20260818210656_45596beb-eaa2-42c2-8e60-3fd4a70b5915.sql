insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from auth.users where email = 'greta.kalikaite@gmail.com'
on conflict (user_id, role) do nothing;