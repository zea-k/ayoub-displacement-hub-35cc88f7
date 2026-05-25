
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _name text;
  _slug text;
  _base_slug text;
  _suffix int := 0;
  _user_type text;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'My Shop');
  _user_type := COALESCE(
    NEW.raw_user_meta_data->>'account_type',
    NEW.raw_user_meta_data->>'user_type',
    'buyer'
  );

  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, _name, NEW.email)
  ON CONFLICT DO NOTHING;

  IF _user_type = 'business' THEN
    _base_slug := regexp_replace(lower(_name), '[^a-z0-9]+', '-', 'g');
    _base_slug := trim(both '-' from _base_slug);
    IF _base_slug = '' THEN _base_slug := 'shop-' || substr(NEW.id::text, 1, 8); END IF;
    _slug := _base_slug;
    WHILE EXISTS (SELECT 1 FROM public.public_settings WHERE slug = _slug) LOOP
      _suffix := _suffix + 1;
      _slug := _base_slug || '-' || _suffix;
    END LOOP;

    INSERT INTO public.public_settings (owner_id, business_name, slug, is_public_enabled, is_listed, theme, theme_color)
    VALUES (NEW.id, _name, _slug, true, true, 'minimal', '#7c3aed')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'owner')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
