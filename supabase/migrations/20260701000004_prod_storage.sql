-- =============================================================================
-- Migration: PROD Storage Buckets + Policies
-- Idempotent: ON CONFLICT for buckets, DROP + CREATE for policies
-- =============================================================================

-- ========================
-- STORAGE BUCKETS
-- ========================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('bug-reports-evidence', 'bug-reports-evidence', false, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm','application/pdf','text/plain','application/json'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('business-logos', 'business-logos', true, 2097152, ARRAY['image/png','image/jpeg','image/jpg','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-attachments', 'chat-attachments', false, 10485760, ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','text/plain','application/zip','application/x-rar-compressed'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cvs', 'cvs', false, 5242880, ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('location-images', 'location-images', true, 5242880, ARRAY['image/png','image/jpeg','image/jpg','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('location-videos', 'location-videos', true, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('service-images', 'service-images', true, 2097152, ARRAY['image/png','image/jpeg','image/jpg','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-avatars', 'user-avatars', true, 2097152, ARRAY['image/png','image/jpeg','image/jpg','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================
-- STORAGE POLICIES
-- ========================

DROP POLICY IF EXISTS "Admins can delete business logos" ON storage.objects;
CREATE POLICY "Admins can delete business logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (((bucket_id = 'business-logos'::text) AND is_business_admin(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Admins can update business logos" ON storage.objects;
CREATE POLICY "Admins can update business logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (((bucket_id = 'business-logos'::text) AND is_business_admin(((storage.foldername(name))[1])::uuid)))
  WITH CHECK (((bucket_id = 'business-logos'::text) AND is_business_admin(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Admins can upload business logos" ON storage.objects;
CREATE POLICY "Admins can upload business logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'business-logos'::text) AND is_business_admin(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Business owners can delete logos" ON storage.objects;
CREATE POLICY "Business owners can delete logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (((bucket_id = 'business-logos'::text) AND is_business_owner_for_storage(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Business owners can delete service images" ON storage.objects;
CREATE POLICY "Business owners can delete service images" ON storage.objects
  FOR DELETE TO authenticated
  USING (((bucket_id = 'service-images'::text) AND (auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (services s
     JOIN businesses b ON ((s.business_id = b.id)))
  WHERE ((s.id = extract_storage_entity_id(( SELECT o.name
           FROM storage.objects o
          WHERE (o.id = objects.id)))) AND (b.owner_id = auth.uid()))))));

DROP POLICY IF EXISTS "Business owners can update logos" ON storage.objects;
CREATE POLICY "Business owners can update logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (((bucket_id = 'business-logos'::text) AND is_business_owner_for_storage(((storage.foldername(name))[1])::uuid)))
;

DROP POLICY IF EXISTS "Business owners can update service images" ON storage.objects;
CREATE POLICY "Business owners can update service images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (((bucket_id = 'service-images'::text) AND (auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (services s
     JOIN businesses b ON ((s.business_id = b.id)))
  WHERE ((s.id = extract_storage_entity_id(( SELECT o.name
           FROM storage.objects o
          WHERE (o.id = objects.id)))) AND (b.owner_id = auth.uid()))))))
;

DROP POLICY IF EXISTS "Business owners can upload logos" ON storage.objects;
CREATE POLICY "Business owners can upload logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'business-logos'::text) AND is_business_owner_for_storage(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Business owners can upload service images" ON storage.objects;
CREATE POLICY "Business owners can upload service images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'service-images'::text) AND (auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (services s
     JOIN businesses b ON ((s.business_id = b.id)))
  WHERE ((s.id = extract_storage_entity_id(( SELECT o.name
           FROM storage.objects o
          WHERE (o.id = objects.id)))) AND (b.owner_id = auth.uid()))))));

DROP POLICY IF EXISTS "Members can delete location images" ON storage.objects;
CREATE POLICY "Members can delete location images" ON storage.objects
  FOR DELETE TO authenticated
  USING (((bucket_id = 'location-images'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Members can delete location videos" ON storage.objects;
CREATE POLICY "Members can delete location videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (((bucket_id = 'location-videos'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Members can update location images" ON storage.objects;
CREATE POLICY "Members can update location images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (((bucket_id = 'location-images'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)))
  WITH CHECK (((bucket_id = 'location-images'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Members can update location videos" ON storage.objects;
CREATE POLICY "Members can update location videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (((bucket_id = 'location-videos'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)))
  WITH CHECK (((bucket_id = 'location-videos'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Members can upload location images" ON storage.objects;
CREATE POLICY "Members can upload location images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'location-images'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Members can upload location videos" ON storage.objects;
CREATE POLICY "Members can upload location videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'location-videos'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Owners or members can delete location images" ON storage.objects;
CREATE POLICY "Owners or members can delete location images" ON storage.objects
  FOR DELETE TO authenticated
  USING (((bucket_id = 'location-images'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Owners or members can delete location videos" ON storage.objects;
CREATE POLICY "Owners or members can delete location videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (((bucket_id = 'location-videos'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Owners or members can delete service images" ON storage.objects;
CREATE POLICY "Owners or members can delete service images" ON storage.objects
  FOR DELETE TO authenticated
  USING (((bucket_id = 'service-images'::text) AND can_manage_service_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Owners or members can update location images" ON storage.objects;
CREATE POLICY "Owners or members can update location images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (((bucket_id = 'location-images'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)))
  WITH CHECK (((bucket_id = 'location-images'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Owners or members can update location videos" ON storage.objects;
CREATE POLICY "Owners or members can update location videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (((bucket_id = 'location-videos'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)))
  WITH CHECK (((bucket_id = 'location-videos'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Owners or members can update service images" ON storage.objects;
CREATE POLICY "Owners or members can update service images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (((bucket_id = 'service-images'::text) AND can_manage_service_media(((storage.foldername(name))[1])::uuid)))
  WITH CHECK (((bucket_id = 'service-images'::text) AND can_manage_service_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Owners or members can upload location images" ON storage.objects;
CREATE POLICY "Owners or members can upload location images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'location-images'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Owners or members can upload location videos" ON storage.objects;
CREATE POLICY "Owners or members can upload location videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'location-videos'::text) AND can_manage_location_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Owners or members can upload service images" ON storage.objects;
CREATE POLICY "Owners or members can upload service images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'service-images'::text) AND can_manage_service_media(((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "Public read access for business logos" ON storage.objects;
CREATE POLICY "Public read access for business logos" ON storage.objects
  FOR SELECT TO public
  USING ((bucket_id = 'business-logos'::text));

DROP POLICY IF EXISTS "Public read access for location images" ON storage.objects;
CREATE POLICY "Public read access for location images" ON storage.objects
  FOR SELECT TO public
  USING ((bucket_id = 'location-images'::text));

DROP POLICY IF EXISTS "Public read access for location videos" ON storage.objects;
CREATE POLICY "Public read access for location videos" ON storage.objects
  FOR SELECT TO public
  USING ((bucket_id = 'location-videos'::text));

DROP POLICY IF EXISTS "Public read access for service images" ON storage.objects;
CREATE POLICY "Public read access for service images" ON storage.objects
  FOR SELECT TO public
  USING ((bucket_id = 'service-images'::text));

DROP POLICY IF EXISTS "Public read access to user avatars" ON storage.objects;
CREATE POLICY "Public read access to user avatars" ON storage.objects
  FOR SELECT TO public
  USING ((bucket_id = 'user-avatars'::text));

DROP POLICY IF EXISTS "Public read images" ON storage.objects;
CREATE POLICY "Public read images" ON storage.objects
  FOR SELECT TO public
  USING ((bucket_id = 'location-images'::text));

DROP POLICY IF EXISTS "Public read service images" ON storage.objects;
CREATE POLICY "Public read service images" ON storage.objects
  FOR SELECT TO public
  USING ((bucket_id = 'service-images'::text));

DROP POLICY IF EXISTS "Public read videos" ON storage.objects;
CREATE POLICY "Public read videos" ON storage.objects
  FOR SELECT TO public
  USING ((bucket_id = 'location-videos'::text));

DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;
CREATE POLICY "Users can delete their own attachments" ON storage.objects
  FOR DELETE TO public
  USING (((bucket_id = 'chat-attachments'::text) AND (owner = auth.uid())));

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (((bucket_id = 'user-avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (((bucket_id = 'user-avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

DROP POLICY IF EXISTS "Users can delete their own bug report evidence" ON storage.objects;
CREATE POLICY "Users can delete their own bug report evidence" ON storage.objects
  FOR DELETE TO public
  USING (((bucket_id = 'bug-reports-evidence'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
CREATE POLICY "Users can update their own attachments" ON storage.objects
  FOR UPDATE TO public
  USING (((bucket_id = 'chat-attachments'::text) AND (owner = auth.uid())))
  WITH CHECK (((bucket_id = 'chat-attachments'::text) AND (owner = auth.uid())));

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (((bucket_id = 'user-avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
  WITH CHECK (((bucket_id = 'user-avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (((bucket_id = 'user-avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
  WITH CHECK (((bucket_id = 'user-avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

DROP POLICY IF EXISTS "Users can update their own bug report evidence" ON storage.objects;
CREATE POLICY "Users can update their own bug report evidence" ON storage.objects
  FOR UPDATE TO public
  USING (((bucket_id = 'bug-reports-evidence'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])))
  WITH CHECK (((bucket_id = 'bug-reports-evidence'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

DROP POLICY IF EXISTS "Users can upload attachments to their conversations" ON storage.objects;
CREATE POLICY "Users can upload attachments to their conversations" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'chat-attachments'::text) AND (auth.uid() IS NOT NULL) AND user_can_access_conversation_attachments(name, auth.uid())));

DROP POLICY IF EXISTS "Users can upload evidence for their own bug reports" ON storage.objects;
CREATE POLICY "Users can upload evidence for their own bug reports" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (((bucket_id = 'bug-reports-evidence'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'user-avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'user-avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON storage.objects;
CREATE POLICY "Users can view attachments in their conversations" ON storage.objects
  FOR SELECT TO authenticated
  USING (((bucket_id = 'chat-attachments'::text) AND (auth.uid() IS NOT NULL) AND user_can_access_conversation_attachments(name, auth.uid())));

DROP POLICY IF EXISTS "Users can view their own bug report evidence" ON storage.objects;
CREATE POLICY "Users can view their own bug report evidence" ON storage.objects
  FOR SELECT TO public
  USING (((bucket_id = 'bug-reports-evidence'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

DROP POLICY IF EXISTS "cvs_delete_policy" ON storage.objects;
CREATE POLICY "cvs_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (((bucket_id = 'cvs'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

DROP POLICY IF EXISTS "cvs_insert_policy" ON storage.objects;
CREATE POLICY "cvs_insert_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'cvs'::text) AND (auth.uid() IS NOT NULL) AND (name ~~ ((auth.uid())::text || '/%'::text))));

DROP POLICY IF EXISTS "cvs_select_policy" ON storage.objects;
CREATE POLICY "cvs_select_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (((bucket_id = 'cvs'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

DROP POLICY IF EXISTS "cvs_update_policy" ON storage.objects;
CREATE POLICY "cvs_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (((bucket_id = 'cvs'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
;
