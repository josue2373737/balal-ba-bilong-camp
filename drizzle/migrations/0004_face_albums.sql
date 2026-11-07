-- Albums par visage (opt-in). Toutes les tables biométriques sont fermées (RLS sans politique) :
-- l'accès passe uniquement par les fonctions SECURITY DEFINER ci-dessous.

CREATE TABLE public.app_admins (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE);
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_admins FROM anon, authenticated;

CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid())
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

CREATE FUNCTION public.face_distance(a real[], b real[]) RETURNS double precision LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT sqrt(sum((x - y) ^ 2)) FROM unnest(a, b) AS t(x, y)
$$;

-- Seuil de correspondance (distance euclidienne entre empreintes). Plus bas = plus strict (moins de faux positifs).
-- Les correspondances sont calculées à l'écriture : après un changement de seuil, supprimez person_photos et rejouez-les.
CREATE FUNCTION public.face_match_threshold() RETURNS double precision LANGUAGE sql IMMUTABLE AS $$ SELECT 0.45::double precision $$;

CREATE TABLE public.face_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text CHECK (name IS NULL OR char_length(btrim(name)) BETWEEN 1 AND 80),
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.person_descriptors (
  id bigserial PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES public.face_people(id) ON DELETE CASCADE,
  descriptor real[] NOT NULL CHECK (array_length(descriptor, 1) = 128)
);
CREATE INDEX person_descriptors_person ON public.person_descriptors(person_id);
CREATE TABLE public.photo_faces (
  id bigserial PRIMARY KEY,
  photo_key text NOT NULL CHECK (char_length(photo_key) BETWEEN 1 AND 200),
  descriptor real[] NOT NULL CHECK (array_length(descriptor, 1) = 128),
  box_x real NOT NULL CHECK (box_x BETWEEN 0 AND 1),
  box_y real NOT NULL CHECK (box_y BETWEEN 0 AND 1),
  box_w real NOT NULL CHECK (box_w > 0 AND box_w <= 1),
  box_h real NOT NULL CHECK (box_h > 0 AND box_h <= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX photo_faces_key ON public.photo_faces(photo_key);
CREATE TABLE public.analyzed_photos (photo_key text PRIMARY KEY, analyzed_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.person_photos (
  person_id uuid NOT NULL REFERENCES public.face_people(id) ON DELETE CASCADE,
  face_id bigint NOT NULL REFERENCES public.photo_faces(id) ON DELETE CASCADE,
  photo_key text NOT NULL,
  distance real NOT NULL,
  PRIMARY KEY (person_id, face_id)
);
CREATE INDEX person_photos_photo ON public.person_photos(person_id, photo_key);

ALTER TABLE public.face_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_descriptors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyzed_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_photos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.face_people, public.person_descriptors, public.photo_faces, public.analyzed_photos, public.person_photos FROM anon, authenticated;

-- Une photo partagée est analysée par son auteur juste après l'envoi (15 min max) ; l'admin peut analyser n'importe laquelle.
CREATE FUNCTION public.submit_photo_faces(p_key text, p_faces jsonb) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF p_key IS NULL OR char_length(p_key) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Clé de photo invalide'; END IF;
  IF jsonb_typeof(p_faces) <> 'array' OR jsonb_array_length(p_faces) > 60 THEN RAISE EXCEPTION 'Visages invalides'; END IF;
  IF NOT public.is_admin() AND NOT EXISTS (SELECT 1 FROM public.camp_memories WHERE image_path = p_key AND created_at > now() - interval '15 minutes') THEN
    RAISE EXCEPTION 'Analyse non autorisée';
  END IF;
  IF EXISTS (SELECT 1 FROM public.analyzed_photos WHERE photo_key = p_key) THEN RETURN 0; END IF;
  INSERT INTO public.analyzed_photos (photo_key) VALUES (p_key);
  INSERT INTO public.photo_faces (photo_key, descriptor, box_x, box_y, box_w, box_h)
  SELECT p_key, ARRAY(SELECT jsonb_array_elements_text(f->'d')::real), (f->>'x')::real, (f->>'y')::real, (f->>'w')::real, (f->>'h')::real
  FROM jsonb_array_elements(p_faces) AS f;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO public.person_photos (person_id, face_id, photo_key, distance)
  SELECT pd.person_id, pf.id, pf.photo_key, min(public.face_distance(pf.descriptor, pd.descriptor))
  FROM public.photo_faces pf CROSS JOIN public.person_descriptors pd
  WHERE pf.photo_key = p_key
  GROUP BY pd.person_id, pf.id, pf.photo_key
  HAVING min(public.face_distance(pf.descriptor, pd.descriptor)) < public.face_match_threshold()
  ON CONFLICT DO NOTHING;
  RETURN n;
END $$;

-- Création de l'album d'une personne (opt-in). Si le visage correspond déjà à un album, on le renvoie.
CREATE FUNCTION public.enroll_person(p_samples jsonb, p_token text) RETURNS TABLE (person_id uuid, existing boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid; first_sample real[];
BEGIN
  IF p_token IS NULL OR char_length(p_token) < 32 THEN RAISE EXCEPTION 'Jeton invalide'; END IF;
  IF jsonb_typeof(p_samples) <> 'array' OR jsonb_array_length(p_samples) NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Échantillons invalides'; END IF;
  first_sample := ARRAY(SELECT jsonb_array_elements_text(p_samples->0)::real);
  IF array_length(first_sample, 1) <> 128 THEN RAISE EXCEPTION 'Empreinte invalide'; END IF;
  SELECT pd.person_id INTO pid FROM public.person_descriptors pd WHERE public.face_distance(pd.descriptor, first_sample) < public.face_match_threshold() - 0.05 ORDER BY public.face_distance(pd.descriptor, first_sample) LIMIT 1;
  IF pid IS NOT NULL THEN RETURN QUERY SELECT pid, true; RETURN; END IF;
  IF (SELECT count(*) FROM public.face_people) >= 500 THEN RAISE EXCEPTION 'Nombre maximal d''albums atteint'; END IF;
  INSERT INTO public.face_people (token_hash) VALUES (encode(sha256(convert_to(p_token, 'utf8')), 'hex')) RETURNING id INTO pid;
  INSERT INTO public.person_descriptors (person_id, descriptor)
  SELECT pid, ARRAY(SELECT jsonb_array_elements_text(s)::real) FROM jsonb_array_elements(p_samples) AS s;
  INSERT INTO public.person_photos (person_id, face_id, photo_key, distance)
  SELECT pid, pf.id, pf.photo_key, min(public.face_distance(pf.descriptor, pd.descriptor))
  FROM public.photo_faces pf JOIN public.person_descriptors pd ON pd.person_id = pid
  GROUP BY pf.id, pf.photo_key
  HAVING min(public.face_distance(pf.descriptor, pd.descriptor)) < public.face_match_threshold();
  RETURN QUERY SELECT pid, false;
END $$;

CREATE FUNCTION public.list_people() RETURNS TABLE (id uuid, name text, photo_count integer, cover_key text, cover_x real, cover_y real, cover_w real, cover_h real) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name,
    (SELECT count(DISTINCT pp.photo_key) FROM public.person_photos pp WHERE pp.person_id = p.id)::integer,
    c.photo_key, c.box_x, c.box_y, c.box_w, c.box_h
  FROM public.face_people p
  LEFT JOIN LATERAL (
    SELECT pf.photo_key, pf.box_x, pf.box_y, pf.box_w, pf.box_h
    FROM public.person_photos pp JOIN public.photo_faces pf ON pf.id = pp.face_id
    WHERE pp.person_id = p.id ORDER BY pp.distance LIMIT 1
  ) c ON true
  ORDER BY (p.name IS NULL), lower(p.name), p.created_at
$$;

CREATE FUNCTION public.person_photo_keys(p_id uuid) RETURNS SETOF text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT photo_key FROM public.person_photos WHERE person_id = p_id
$$;

CREATE FUNCTION public.delete_person(p_id uuid, p_token text DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() AND NOT EXISTS (SELECT 1 FROM public.face_people WHERE id = p_id AND p_token IS NOT NULL AND token_hash = encode(sha256(convert_to(p_token, 'utf8')), 'hex')) THEN
    RETURN false;
  END IF;
  DELETE FROM public.face_people WHERE id = p_id;
  RETURN FOUND;
END $$;

CREATE FUNCTION public.rename_person(p_id uuid, p_name text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Réservé à l''administrateur'; END IF;
  UPDATE public.face_people SET name = NULLIF(btrim(p_name), '') WHERE id = p_id;
  RETURN FOUND;
END $$;

CREATE FUNCTION public.admin_unanalyzed(p_keys text[]) RETURNS SETOF text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Réservé à l''administrateur'; END IF;
  RETURN QUERY SELECT k FROM unnest(p_keys) AS k WHERE NOT EXISTS (SELECT 1 FROM public.analyzed_photos a WHERE a.photo_key = k);
END $$;

REVOKE ALL ON FUNCTION public.submit_photo_faces, public.enroll_person, public.list_people, public.person_photo_keys, public.delete_person, public.rename_person, public.admin_unanalyzed FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_photo_faces, public.enroll_person, public.list_people, public.person_photo_keys, public.delete_person, public.rename_person, public.admin_unanalyzed TO anon, authenticated;
