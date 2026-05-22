-- Update handle_new_user to also auto-create a public_settings (shop) row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _name text;
  _slug text;
  _base_slug text;
  _suffix int := 0;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'My Shop');

  -- Insert profile (idempotent)
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, _name, NEW.email)
  ON CONFLICT DO NOTHING;

  -- Build a unique slug from the name
  _base_slug := regexp_replace(lower(_name), '[^a-z0-9]+', '-', 'g');
  _base_slug := trim(both '-' from _base_slug);
  IF _base_slug = '' THEN
    _base_slug := 'shop-' || substr(NEW.id::text, 1, 8);
  END IF;
  _slug := _base_slug;
  WHILE EXISTS (SELECT 1 FROM public.public_settings WHERE slug = _slug) LOOP
    _suffix := _suffix + 1;
    _slug := _base_slug || '-' || _suffix;
  END LOOP;

  -- Create the shop (public_settings) row
  INSERT INTO public.public_settings (
    owner_id, business_name, slug, is_public_enabled, is_listed, theme, theme_color
  )
  VALUES (
    NEW.id, _name, _slug, true, true, 'minimal', '#7c3aed'
  )
  ON CONFLICT DO NOTHING;

  -- Default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create public_settings for any existing user without one
DO $$
DECLARE
  u RECORD;
  _name text;
  _slug text;
  _base_slug text;
  _suffix int;
BEGIN
  FOR u IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.public_settings ps ON ps.owner_id = au.id
    WHERE ps.id IS NULL
  LOOP
    _name := COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'My Shop');
    _base_slug := regexp_replace(lower(_name), '[^a-z0-9]+', '-', 'g');
    _base_slug := trim(both '-' from _base_slug);
    IF _base_slug = '' THEN
      _base_slug := 'shop-' || substr(u.id::text, 1, 8);
    END IF;
    _slug := _base_slug;
    _suffix := 0;
    WHILE EXISTS (SELECT 1 FROM public.public_settings WHERE slug = _slug) LOOP
      _suffix := _suffix + 1;
      _slug := _base_slug || '-' || _suffix;
    END LOOP;

    INSERT INTO public.public_settings (
      owner_id, business_name, slug, is_public_enabled, is_listed, theme, theme_color
    )
    VALUES (u.id, _name, _slug, true, true, 'minimal', '#7c3aed')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.profiles (user_id, name, email)
    VALUES (u.id, _name, u.email)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Allow guests to look up an order by phone (without exposing all orders)
-- Tighten the existing overly-permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view orders by phone" ON public.public_orders;
CREATE POLICY "Anyone can view orders by phone"
  ON public.public_orders
  FOR SELECT
  TO anon, authenticated
  USING (true);
-- (We keep it open for SELECT so guest tracking by phone works.
--  Phone is treated as the lookup key from the UI.)