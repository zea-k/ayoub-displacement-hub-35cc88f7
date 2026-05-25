
DELETE FROM public.public_settings ps
USING public.user_profiles up
WHERE ps.owner_id = up.id
  AND up.user_type = 'buyer';

DELETE FROM public.user_roles ur
USING public.user_profiles up
WHERE ur.user_id = up.id
  AND up.user_type = 'buyer'
  AND ur.role = 'owner';
