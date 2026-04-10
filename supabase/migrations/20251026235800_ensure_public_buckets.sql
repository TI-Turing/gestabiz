-- Ensure storage buckets for location media exist and are public
-- Buckets: location-images, location-videos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('location-images', 'location-images', TRUE)
    ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, name = EXCLUDED.name;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('location-videos', 'location-videos', TRUE)
    ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, name = EXCLUDED.name;
  END IF;
END $$;

-- Storage policies (safe drop/recreate)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'objects'
  ) THEN
    DROP POLICY IF EXISTS "Public read images" ON storage.objects;
    DROP POLICY IF EXISTS "Public read videos" ON storage.objects;
    EXECUTE 'CREATE POLICY "Public read images" ON storage.objects FOR SELECT USING (bucket_id = ''location-images'')';
    EXECUTE 'CREATE POLICY "Public read videos" ON storage.objects FOR SELECT USING (bucket_id = ''location-videos'')';
  END IF;
END $$;
