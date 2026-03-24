-- RLS Policies Part 1 (absence_approval_requests → locations)
-- Applied to PROD on 2026-03-24

-- absence_approval_requests
DROP POLICY IF EXISTS "Admins can update approval requests" ON public.absence_approval_requests;
CREATE POLICY "Admins can update approval requests" ON public.absence_approval_requests AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = absence_approval_requests.business_id) AND (b.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = absence_approval_requests.business_id) AND (b.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "Admins can view approval requests" ON public.absence_approval_requests;
CREATE POLICY "Admins can view approval requests" ON public.absence_approval_requests AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = absence_approval_requests.business_id) AND (b.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "System can create approval requests" ON public.absence_approval_requests;
CREATE POLICY "System can create approval requests" ON public.absence_approval_requests AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (true);

-- appointments
DROP POLICY IF EXISTS "appointments_business_owner" ON public.appointments;
CREATE POLICY "appointments_business_owner" ON public.appointments AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = appointments.business_id) AND (b.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "appointments_client" ON public.appointments;
CREATE POLICY "appointments_client" ON public.appointments AS PERMISSIVE FOR ALL TO PUBLIC USING ((client_id = auth.uid()));

DROP POLICY IF EXISTS "appointments_employee" ON public.appointments;
CREATE POLICY "appointments_employee" ON public.appointments AS PERMISSIVE FOR ALL TO PUBLIC USING ((employee_id = auth.uid()));

-- billing_audit_log
DROP POLICY IF EXISTS "Business admins can view billing audit log" ON public.billing_audit_log;
CREATE POLICY "Business admins can view billing audit log" ON public.billing_audit_log AS PERMISSIVE FOR SELECT TO PUBLIC USING (is_business_admin(business_id));

DROP POLICY IF EXISTS "Service role can insert into billing audit log" ON public.billing_audit_log;
CREATE POLICY "Service role can insert into billing audit log" ON public.billing_audit_log AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- bug_reports
DROP POLICY IF EXISTS "Authenticated users can insert bug reports" ON public.bug_reports;
CREATE POLICY "Authenticated users can insert bug reports" ON public.bug_reports AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view own bug reports" ON public.bug_reports;
CREATE POLICY "Authenticated users can view own bug reports" ON public.bug_reports AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "Business owners can manage all bug reports" ON public.bug_reports;
CREATE POLICY "Business owners can manage all bug reports" ON public.bug_reports AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "Business owners can update bug reports" ON public.bug_reports;
CREATE POLICY "Business owners can update bug reports" ON public.bug_reports AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses WHERE (businesses.owner_id = auth.uid())))) WITH CHECK ((EXISTS ( SELECT 1 FROM businesses WHERE (businesses.owner_id = auth.uid()))));

-- business_categories
DROP POLICY IF EXISTS "Allow public read access to active categories" ON public.business_categories;
CREATE POLICY "Allow public read access to active categories" ON public.business_categories AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_active = true));

-- business_confirmation_policies
DROP POLICY IF EXISTS "business_confirmation_policies_business_access" ON public.business_confirmation_policies;
CREATE POLICY "business_confirmation_policies_business_access" ON public.business_confirmation_policies AS PERMISSIVE FOR ALL TO PUBLIC USING ((business_id IN ( SELECT business_employees.business_id FROM business_employees WHERE ((business_employees.employee_id = auth.uid()) AND (business_employees.role = 'manager'::text) AND (business_employees.status = 'approved'::employee_status)))));

DROP POLICY IF EXISTS "business_confirmation_policies_member_read" ON public.business_confirmation_policies;
CREATE POLICY "business_confirmation_policies_member_read" ON public.business_confirmation_policies AS PERMISSIVE FOR SELECT TO PUBLIC USING ((business_id IN ( SELECT business_employees.business_id FROM business_employees WHERE ((business_employees.employee_id = auth.uid()) AND (business_employees.status = 'approved'::employee_status)))));

-- business_employees
DROP POLICY IF EXISTS "business_employees_self" ON public.business_employees;
CREATE POLICY "business_employees_self" ON public.business_employees AS PERMISSIVE FOR ALL TO PUBLIC USING (((employee_id = auth.uid()) OR (EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = business_employees.business_id) AND (b.owner_id = auth.uid()))))));

DROP POLICY IF EXISTS "del_business_employees_by_owner" ON public.business_employees;
CREATE POLICY "del_business_employees_by_owner" ON public.business_employees AS PERMISSIVE FOR DELETE TO PUBLIC USING ((auth.uid() IN ( SELECT businesses.owner_id FROM businesses WHERE (businesses.id = business_employees.business_id))));

DROP POLICY IF EXISTS "delete_business_employees" ON public.business_employees;
CREATE POLICY "delete_business_employees" ON public.business_employees AS PERMISSIVE FOR DELETE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = business_employees.business_id) AND (b.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "ins_business_employees_self" ON public.business_employees;
CREATE POLICY "ins_business_employees_self" ON public.business_employees AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((auth.uid() = employee_id) OR (auth.uid() IN ( SELECT businesses.owner_id FROM businesses WHERE (businesses.id = business_employees.business_id)))));

DROP POLICY IF EXISTS "insert_business_employees" ON public.business_employees;
CREATE POLICY "insert_business_employees" ON public.business_employees AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = business_employees.business_id) AND (b.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "sel_business_employees" ON public.business_employees;
CREATE POLICY "sel_business_employees" ON public.business_employees AS PERMISSIVE FOR SELECT TO PUBLIC USING (((status = 'approved'::employee_status) AND (is_active = true)));

DROP POLICY IF EXISTS "upd_business_employees_self" ON public.business_employees;
CREATE POLICY "upd_business_employees_self" ON public.business_employees AS PERMISSIVE FOR UPDATE TO PUBLIC USING (((auth.uid() = employee_id) OR (auth.uid() IN ( SELECT businesses.owner_id FROM businesses WHERE (businesses.id = business_employees.business_id))))) WITH CHECK (((auth.uid() = employee_id) OR (auth.uid() IN ( SELECT businesses.owner_id FROM businesses WHERE (businesses.id = business_employees.business_id)))));

DROP POLICY IF EXISTS "update_business_employees" ON public.business_employees;
CREATE POLICY "update_business_employees" ON public.business_employees AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = business_employees.business_id) AND (b.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = business_employees.business_id) AND (b.owner_id = auth.uid())))));

-- business_favorites
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.business_favorites;
CREATE POLICY "Users can delete their own favorites" ON public.business_favorites AS PERMISSIVE FOR DELETE TO PUBLIC USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.business_favorites;
CREATE POLICY "Users can insert their own favorites" ON public.business_favorites AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.business_favorites;
CREATE POLICY "Users can view their own favorites" ON public.business_favorites AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = user_id));

-- business_notification_settings
DROP POLICY IF EXISTS "business_notification_settings_insert_policy" ON public.business_notification_settings;
CREATE POLICY "business_notification_settings_insert_policy" ON public.business_notification_settings AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "business_notification_settings_select_policy" ON public.business_notification_settings;
CREATE POLICY "business_notification_settings_select_policy" ON public.business_notification_settings AS PERMISSIVE FOR SELECT TO PUBLIC USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()) UNION SELECT business_employees.business_id FROM business_employees WHERE (business_employees.employee_id = auth.uid()))));

DROP POLICY IF EXISTS "business_notification_settings_update_policy" ON public.business_notification_settings;
CREATE POLICY "business_notification_settings_update_policy" ON public.business_notification_settings AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid())))) WITH CHECK ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

-- business_plans
DROP POLICY IF EXISTS "Public read access to business_plans" ON public.business_plans;
CREATE POLICY "Public read access to business_plans" ON public.business_plans AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

-- business_resources
DROP POLICY IF EXISTS "Business admins can manage resources" ON public.business_resources;
CREATE POLICY "Business admins can manage resources" ON public.business_resources AS PERMISSIVE FOR ALL TO PUBLIC USING ((business_id IN ( SELECT business_roles.business_id FROM business_roles WHERE ((business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text) AND (business_roles.is_active = true)))));

DROP POLICY IF EXISTS "Business owners can manage resources" ON public.business_resources;
CREATE POLICY "Business owners can manage resources" ON public.business_resources AS PERMISSIVE FOR ALL TO PUBLIC USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "Public can view active resources" ON public.business_resources;
CREATE POLICY "Public can view active resources" ON public.business_resources AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_active = true));

-- business_roles
DROP POLICY IF EXISTS "business_roles_delete" ON public.business_roles;
CREATE POLICY "business_roles_delete" ON public.business_roles AS PERMISSIVE FOR DELETE TO PUBLIC USING (((is_business_owner(auth.uid(), business_id) AND (NOT ((user_id = auth.uid()) AND (role = 'admin'::text)))) OR (EXISTS ( SELECT 1 FROM user_permissions up WHERE ((up.user_id = auth.uid()) AND (up.business_id = business_roles.business_id) AND (up.permission = 'permissions.revoke'::text) AND (up.is_active = true))))));

DROP POLICY IF EXISTS "business_roles_insert" ON public.business_roles;
CREATE POLICY "business_roles_insert" ON public.business_roles AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((is_business_owner(auth.uid(), business_id) OR ((role = 'employee'::text) AND (EXISTS ( SELECT 1 FROM user_permissions up WHERE ((up.user_id = auth.uid()) AND (up.business_id = business_roles.business_id) AND (up.permission = 'permissions.assign_employee'::text) AND (up.is_active = true)))))));

DROP POLICY IF EXISTS "business_roles_select" ON public.business_roles;
CREATE POLICY "business_roles_select" ON public.business_roles AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_business_owner(auth.uid(), business_id) OR (user_id = auth.uid()) OR (EXISTS ( SELECT 1 FROM get_user_permissions(auth.uid(), business_roles.business_id) p(permission) WHERE (p.permission = 'permissions.view'::text)))));

DROP POLICY IF EXISTS "business_roles_update" ON public.business_roles;
CREATE POLICY "business_roles_update" ON public.business_roles AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1 FROM get_user_permissions(auth.uid(), business_roles.business_id) p(permission) WHERE (p.permission = 'permissions.modify'::text))))) WITH CHECK ((is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1 FROM get_user_permissions(auth.uid(), business_roles.business_id) p(permission) WHERE (p.permission = 'permissions.modify'::text)))));

-- business_subcategories
DROP POLICY IF EXISTS "Allow business owners to manage subcategories" ON public.business_subcategories;
CREATE POLICY "Allow business owners to manage subcategories" ON public.business_subcategories AS PERMISSIVE FOR ALL TO PUBLIC USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "Allow public read access to business subcategories" ON public.business_subcategories;
CREATE POLICY "Allow public read access to business subcategories" ON public.business_subcategories AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

-- businesses
DROP POLICY IF EXISTS "businesses_delete_policy" ON public.businesses;
CREATE POLICY "businesses_delete_policy" ON public.businesses AS PERMISSIVE FOR DELETE TO PUBLIC USING ((owner_id = auth.uid()));

DROP POLICY IF EXISTS "businesses_insert_policy" ON public.businesses;
CREATE POLICY "businesses_insert_policy" ON public.businesses AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((auth.uid() IS NOT NULL) AND (owner_id = auth.uid())));

DROP POLICY IF EXISTS "businesses_select_policy" ON public.businesses;
CREATE POLICY "businesses_select_policy" ON public.businesses AS PERMISSIVE FOR SELECT TO PUBLIC USING (((owner_id = auth.uid()) OR (is_active = true)));

DROP POLICY IF EXISTS "businesses_update_policy" ON public.businesses;
CREATE POLICY "businesses_update_policy" ON public.businesses AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((owner_id = auth.uid())) WITH CHECK ((owner_id = auth.uid()));

DROP POLICY IF EXISTS "public_read_active_businesses" ON public.businesses;
CREATE POLICY "public_read_active_businesses" ON public.businesses AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_active = true));

-- calendar_sync_settings
DROP POLICY IF EXISTS "calendar_sync_settings_owner" ON public.calendar_sync_settings;
CREATE POLICY "calendar_sync_settings_owner" ON public.calendar_sync_settings AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

-- chat_conversations
DROP POLICY IF EXISTS "creator_delete_conversations" ON public.chat_conversations;
CREATE POLICY "creator_delete_conversations" ON public.chat_conversations AS PERMISSIVE FOR DELETE TO authenticated USING ((created_by = auth.uid()));

DROP POLICY IF EXISTS "users_insert_conversations" ON public.chat_conversations;
CREATE POLICY "users_insert_conversations" ON public.chat_conversations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((created_by = auth.uid()));

DROP POLICY IF EXISTS "users_select_conversations" ON public.chat_conversations;
CREATE POLICY "users_select_conversations" ON public.chat_conversations AS PERMISSIVE FOR SELECT TO authenticated USING (user_is_in_conversation(id, auth.uid()));

DROP POLICY IF EXISTS "users_update_conversations" ON public.chat_conversations;
CREATE POLICY "users_update_conversations" ON public.chat_conversations AS PERMISSIVE FOR UPDATE TO PUBLIC USING (user_is_in_conversation(id, auth.uid())) WITH CHECK (user_is_in_conversation(id, auth.uid()));

-- chat_messages
DROP POLICY IF EXISTS "users_delete_own_messages" ON public.chat_messages;
CREATE POLICY "users_delete_own_messages" ON public.chat_messages AS PERMISSIVE FOR DELETE TO authenticated USING ((sender_id = auth.uid()));

DROP POLICY IF EXISTS "users_insert_messages" ON public.chat_messages;
CREATE POLICY "users_insert_messages" ON public.chat_messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((sender_id = auth.uid()) AND user_is_in_conversation(conversation_id, auth.uid())));

DROP POLICY IF EXISTS "users_select_messages" ON public.chat_messages;
CREATE POLICY "users_select_messages" ON public.chat_messages AS PERMISSIVE FOR SELECT TO authenticated USING (user_is_in_conversation(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "users_update_own_messages" ON public.chat_messages;
CREATE POLICY "users_update_own_messages" ON public.chat_messages AS PERMISSIVE FOR UPDATE TO authenticated USING ((sender_id = auth.uid())) WITH CHECK ((sender_id = auth.uid()));

-- chat_participants
DROP POLICY IF EXISTS "users_delete_own_participant" ON public.chat_participants;
CREATE POLICY "users_delete_own_participant" ON public.chat_participants AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "users_insert_participants" ON public.chat_participants;
CREATE POLICY "users_insert_participants" ON public.chat_participants AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) OR (EXISTS ( SELECT 1 FROM chat_conversations WHERE ((chat_conversations.id = chat_participants.conversation_id) AND (chat_conversations.created_by = auth.uid()))))));

DROP POLICY IF EXISTS "users_select_participants" ON public.chat_participants;
CREATE POLICY "users_select_participants" ON public.chat_participants AS PERMISSIVE FOR SELECT TO authenticated USING (user_is_in_conversation(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "users_update_own_participant" ON public.chat_participants;
CREATE POLICY "users_update_own_participant" ON public.chat_participants AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

-- chat_typing_indicators
DROP POLICY IF EXISTS "users_delete_typing" ON public.chat_typing_indicators;
CREATE POLICY "users_delete_typing" ON public.chat_typing_indicators AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "users_insert_typing" ON public.chat_typing_indicators;
CREATE POLICY "users_insert_typing" ON public.chat_typing_indicators AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) AND user_is_in_conversation(conversation_id, auth.uid())));

DROP POLICY IF EXISTS "users_select_typing" ON public.chat_typing_indicators;
CREATE POLICY "users_select_typing" ON public.chat_typing_indicators AS PERMISSIVE FOR SELECT TO authenticated USING (user_is_in_conversation(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "users_update_typing" ON public.chat_typing_indicators;
CREATE POLICY "users_update_typing" ON public.chat_typing_indicators AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

-- cities
DROP POLICY IF EXISTS "Public read access to cities" ON public.cities;
CREATE POLICY "Public read access to cities" ON public.cities AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

-- conversation_members
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_members;
CREATE POLICY "Users can join conversations" ON public.conversation_members AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_members;
CREATE POLICY "Users can leave conversations" ON public.conversation_members AS PERMISSIVE FOR DELETE TO PUBLIC USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own membership" ON public.conversation_members;
CREATE POLICY "Users can update their own membership" ON public.conversation_members AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view members of conversations they belong to" ON public.conversation_members;
CREATE POLICY "Users can view members of conversations they belong to" ON public.conversation_members AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1 FROM conversation_members cm WHERE ((cm.conversation_id = conversation_members.conversation_id) AND (cm.user_id = auth.uid())))));

-- conversations
DROP POLICY IF EXISTS "Users can create conversations in their businesses" ON public.conversations;
CREATE POLICY "Users can create conversations in their businesses" ON public.conversations AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((created_by = auth.uid()));

DROP POLICY IF EXISTS "Users can update conversations they created" ON public.conversations;
CREATE POLICY "Users can update conversations they created" ON public.conversations AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((created_by = auth.uid())) WITH CHECK ((created_by = auth.uid()));

DROP POLICY IF EXISTS "Users can view conversations they are members of" ON public.conversations;
CREATE POLICY "Users can view conversations they are members of" ON public.conversations AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1 FROM conversation_members WHERE ((conversation_members.conversation_id = conversations.id) AND (conversation_members.user_id = auth.uid())))));

-- countries
DROP POLICY IF EXISTS "Public read access to countries" ON public.countries;
CREATE POLICY "Public read access to countries" ON public.countries AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

-- discount_code_uses
DROP POLICY IF EXISTS "Service role can insert discount code uses" ON public.discount_code_uses;
CREATE POLICY "Service role can insert discount code uses" ON public.discount_code_uses AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view their own discount code uses" ON public.discount_code_uses;
CREATE POLICY "Users can view their own discount code uses" ON public.discount_code_uses AS PERMISSIVE FOR SELECT TO PUBLIC USING (((used_by = auth.uid()) OR is_business_admin(business_id)));

-- discount_codes
DROP POLICY IF EXISTS "Anyone can view active discount codes" ON public.discount_codes;
CREATE POLICY "Anyone can view active discount codes" ON public.discount_codes AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_active = true));

DROP POLICY IF EXISTS "Service role has full access to discount codes" ON public.discount_codes;
CREATE POLICY "Service role has full access to discount codes" ON public.discount_codes AS PERMISSIVE FOR ALL TO PUBLIC USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text)) WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- document_types
DROP POLICY IF EXISTS "Public read access to document_types" ON public.document_types;
CREATE POLICY "Public read access to document_types" ON public.document_types AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

-- employee_absences
DROP POLICY IF EXISTS "Admins can create absences" ON public.employee_absences;
CREATE POLICY "Admins can create absences" ON public.employee_absences AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = employee_absences.business_id) AND (b.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "Admins can update absence status" ON public.employee_absences;
CREATE POLICY "Admins can update absence status" ON public.employee_absences AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = employee_absences.business_id) AND (b.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = employee_absences.business_id) AND (b.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "Admins can view all absences in their business" ON public.employee_absences;
CREATE POLICY "Admins can view all absences in their business" ON public.employee_absences AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = employee_absences.business_id) AND (b.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "Employees can create absence requests" ON public.employee_absences;
CREATE POLICY "Employees can create absence requests" ON public.employee_absences AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((employee_id = auth.uid()));

DROP POLICY IF EXISTS "Employees can update their pending absences" ON public.employee_absences;
CREATE POLICY "Employees can update their pending absences" ON public.employee_absences AS PERMISSIVE FOR UPDATE TO PUBLIC USING (((employee_id = auth.uid()) AND ((status)::text = 'pending'::text))) WITH CHECK ((employee_id = auth.uid()));

DROP POLICY IF EXISTS "Employees can view their own absences" ON public.employee_absences;
CREATE POLICY "Employees can view their own absences" ON public.employee_absences AS PERMISSIVE FOR SELECT TO PUBLIC USING ((employee_id = auth.uid()));

-- employee_join_requests
DROP POLICY IF EXISTS "employee_join_requests_insert_invite" ON public.employee_join_requests;
CREATE POLICY "employee_join_requests_insert_invite" ON public.employee_join_requests AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((employee_id IS NULL) AND ((EXISTS ( SELECT 1 FROM businesses WHERE ((businesses.id = employee_join_requests.business_id) AND (businesses.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1 FROM business_roles WHERE ((business_roles.business_id = business_roles.business_id) AND (business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text)))))));

DROP POLICY IF EXISTS "employee_join_requests_insert_own" ON public.employee_join_requests;
CREATE POLICY "employee_join_requests_insert_own" ON public.employee_join_requests AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = employee_id));

DROP POLICY IF EXISTS "employee_join_requests_select_admin" ON public.employee_join_requests;
CREATE POLICY "employee_join_requests_select_admin" ON public.employee_join_requests AS PERMISSIVE FOR SELECT TO PUBLIC USING (((EXISTS ( SELECT 1 FROM businesses WHERE ((businesses.id = employee_join_requests.business_id) AND (businesses.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1 FROM business_roles WHERE ((business_roles.business_id = employee_join_requests.business_id) AND (business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text))))));

DROP POLICY IF EXISTS "employee_join_requests_select_own" ON public.employee_join_requests;
CREATE POLICY "employee_join_requests_select_own" ON public.employee_join_requests AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = employee_id));

DROP POLICY IF EXISTS "employee_join_requests_update_admin" ON public.employee_join_requests;
CREATE POLICY "employee_join_requests_update_admin" ON public.employee_join_requests AS PERMISSIVE FOR UPDATE TO PUBLIC USING (((EXISTS ( SELECT 1 FROM businesses WHERE ((businesses.id = employee_join_requests.business_id) AND (businesses.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1 FROM business_roles WHERE ((business_roles.business_id = employee_join_requests.business_id) AND (business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text))))));

-- employee_profiles
DROP POLICY IF EXISTS "Public profiles visible" ON public.employee_profiles;
CREATE POLICY "Public profiles visible" ON public.employee_profiles AS PERMISSIVE FOR SELECT TO PUBLIC USING ((available_for_hire = true));

DROP POLICY IF EXISTS "Users can insert own employee profile" ON public.employee_profiles;
CREATE POLICY "Users can insert own employee profile" ON public.employee_profiles AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update own employee profile" ON public.employee_profiles;
CREATE POLICY "Users can update own employee profile" ON public.employee_profiles AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view own employee profile" ON public.employee_profiles;
CREATE POLICY "Users can view own employee profile" ON public.employee_profiles AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = user_id));

-- employee_requests
DROP POLICY IF EXISTS "Business owners can respond to requests" ON public.employee_requests;
CREATE POLICY "Business owners can respond to requests" ON public.employee_requests AS PERMISSIVE FOR UPDATE TO authenticated USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid())))) WITH CHECK ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "Business owners can view requests for their businesses" ON public.employee_requests;
CREATE POLICY "Business owners can view requests for their businesses" ON public.employee_requests AS PERMISSIVE FOR SELECT TO authenticated USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "Users can create employee requests" ON public.employee_requests;
CREATE POLICY "Users can create employee requests" ON public.employee_requests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view own requests" ON public.employee_requests;
CREATE POLICY "Users can view own requests" ON public.employee_requests AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));

-- employee_services
DROP POLICY IF EXISTS "Employees can read own services" ON public.employee_services;
CREATE POLICY "Employees can read own services" ON public.employee_services AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = employee_id));

DROP POLICY IF EXISTS "Managers can read employee services" ON public.employee_services;
CREATE POLICY "Managers can read employee services" ON public.employee_services AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() IN ( SELECT business_employees.employee_id FROM business_employees WHERE ((business_employees.business_id = employee_services.business_id) AND (business_employees.role = 'manager'::text) AND (business_employees.status = 'approved'::employee_status)))));

DROP POLICY IF EXISTS "Owners can manage employee services" ON public.employee_services;
CREATE POLICY "Owners can manage employee services" ON public.employee_services AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() IN ( SELECT businesses.owner_id FROM businesses WHERE (businesses.id = employee_services.business_id))));

DROP POLICY IF EXISTS "Public can read active employee services" ON public.employee_services;
CREATE POLICY "Public can read active employee services" ON public.employee_services AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_active = true));

DROP POLICY IF EXISTS "del_employee_services" ON public.employee_services;
CREATE POLICY "del_employee_services" ON public.employee_services AS PERMISSIVE FOR DELETE TO PUBLIC USING (((auth.uid() = employee_id) OR (EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = employee_services.business_id) AND (b.owner_id = auth.uid()))))));

DROP POLICY IF EXISTS "ins_employee_services" ON public.employee_services;
CREATE POLICY "ins_employee_services" ON public.employee_services AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((auth.uid() = employee_id) OR (EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = employee_services.business_id) AND (b.owner_id = auth.uid()))))));

DROP POLICY IF EXISTS "sel_employee_services" ON public.employee_services;
CREATE POLICY "sel_employee_services" ON public.employee_services AS PERMISSIVE FOR SELECT TO PUBLIC USING (((auth.uid() = employee_id) OR (EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = employee_services.business_id) AND (b.owner_id = auth.uid()))))));

DROP POLICY IF EXISTS "upd_employee_services" ON public.employee_services;
CREATE POLICY "upd_employee_services" ON public.employee_services AS PERMISSIVE FOR UPDATE TO PUBLIC USING (((auth.uid() = employee_id) OR (EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = employee_services.business_id) AND (b.owner_id = auth.uid())))))) WITH CHECK (((auth.uid() = employee_id) OR (EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = employee_services.business_id) AND (b.owner_id = auth.uid()))))));

-- employee_time_off
DROP POLICY IF EXISTS "Employees can cancel own pending requests" ON public.employee_time_off;
CREATE POLICY "Employees can cancel own pending requests" ON public.employee_time_off AS PERMISSIVE FOR UPDATE TO PUBLIC USING (((employee_id = auth.uid()) AND ((status)::text = 'pending'::text))) WITH CHECK ((((status)::text = 'cancelled'::text) AND (cancelled_at IS NOT NULL)));

DROP POLICY IF EXISTS "Employees can create time off requests" ON public.employee_time_off;
CREATE POLICY "Employees can create time off requests" ON public.employee_time_off AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((employee_id = auth.uid()) AND ((status)::text = 'pending'::text)));

DROP POLICY IF EXISTS "Employees can view own time off" ON public.employee_time_off;
CREATE POLICY "Employees can view own time off" ON public.employee_time_off AS PERMISSIVE FOR SELECT TO PUBLIC USING ((employee_id = auth.uid()));

DROP POLICY IF EXISTS "Managers can review time off requests" ON public.employee_time_off;
CREATE POLICY "Managers can review time off requests" ON public.employee_time_off AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM business_employees WHERE ((business_employees.business_id = employee_time_off.business_id) AND (business_employees.employee_id = auth.uid()) AND (business_employees.role = 'manager'::text) AND (business_employees.is_active = true) AND (business_employees.status = 'approved'::employee_status))))) WITH CHECK ((((status)::text = ANY (ARRAY[('approved'::character varying)::text, ('rejected'::character varying)::text])) AND (reviewed_at IS NOT NULL) AND (reviewed_by = auth.uid())));

DROP POLICY IF EXISTS "Managers can view business time off" ON public.employee_time_off;
CREATE POLICY "Managers can view business time off" ON public.employee_time_off AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1 FROM business_employees WHERE ((business_employees.business_id = employee_time_off.business_id) AND (business_employees.employee_id = auth.uid()) AND (business_employees.role = 'manager'::text) AND (business_employees.is_active = true) AND (business_employees.status = 'approved'::employee_status)))));

-- error_logs
DROP POLICY IF EXISTS "Admins can update error logs" ON public.error_logs;
CREATE POLICY "Admins can update error logs" ON public.error_logs AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses WHERE (businesses.owner_id = auth.uid())))) WITH CHECK ((EXISTS ( SELECT 1 FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "Admins can view all error logs" ON public.error_logs;
CREATE POLICY "Admins can view all error logs" ON public.error_logs AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "Service can insert error logs" ON public.error_logs;
CREATE POLICY "Service can insert error logs" ON public.error_logs AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own error logs" ON public.error_logs;
CREATE POLICY "Users can view their own error logs" ON public.error_logs AS PERMISSIVE FOR SELECT TO PUBLIC USING ((user_id = auth.uid()));

-- genders
DROP POLICY IF EXISTS "Public read access to genders" ON public.genders;
CREATE POLICY "Public read access to genders" ON public.genders AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

-- health_insurance
DROP POLICY IF EXISTS "Public read access to health_insurance" ON public.health_insurance;
CREATE POLICY "Public read access to health_insurance" ON public.health_insurance AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

-- in_app_notifications
DROP POLICY IF EXISTS "system_insert_notifications" ON public.in_app_notifications;
CREATE POLICY "system_insert_notifications" ON public.in_app_notifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "users_delete_own_notifications" ON public.in_app_notifications;
CREATE POLICY "users_delete_own_notifications" ON public.in_app_notifications AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "users_select_own_notifications" ON public.in_app_notifications;
CREATE POLICY "users_select_own_notifications" ON public.in_app_notifications AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "users_update_own_notifications" ON public.in_app_notifications;
CREATE POLICY "users_update_own_notifications" ON public.in_app_notifications AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

-- invoice_items
DROP POLICY IF EXISTS "Items inherit invoice policy" ON public.invoice_items;
CREATE POLICY "Items inherit invoice policy" ON public.invoice_items AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() IN ( SELECT b.owner_id FROM (invoices i JOIN businesses b ON ((i.business_id = b.id))) WHERE (i.id = invoice_items.invoice_id))));

-- invoices
DROP POLICY IF EXISTS "Clients can read own invoices" ON public.invoices;
CREATE POLICY "Clients can read own invoices" ON public.invoices AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = client_id));

DROP POLICY IF EXISTS "Owners can manage invoices" ON public.invoices;
CREATE POLICY "Owners can manage invoices" ON public.invoices AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() IN ( SELECT businesses.owner_id FROM businesses WHERE (businesses.id = invoices.business_id))));

-- job_applications
DROP POLICY IF EXISTS "job_applications_delete_own" ON public.job_applications;
CREATE POLICY "job_applications_delete_own" ON public.job_applications AS PERMISSIVE FOR DELETE TO PUBLIC USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "job_applications_insert_own" ON public.job_applications;
CREATE POLICY "job_applications_insert_own" ON public.job_applications AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "job_applications_select_policy" ON public.job_applications;
CREATE POLICY "job_applications_select_policy" ON public.job_applications AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))) OR (business_id IN ( SELECT business_employees.business_id FROM business_employees WHERE (business_employees.employee_id = auth.uid())))));

DROP POLICY IF EXISTS "job_applications_update_own" ON public.job_applications;
CREATE POLICY "job_applications_update_own" ON public.job_applications AS PERMISSIVE FOR UPDATE TO PUBLIC USING (((user_id = auth.uid()) OR (business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))))) WITH CHECK (((user_id = auth.uid()) OR (business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid())))));

-- job_vacancies
DROP POLICY IF EXISTS "job_vacancies_delete_business_owner" ON public.job_vacancies;
CREATE POLICY "job_vacancies_delete_business_owner" ON public.job_vacancies AS PERMISSIVE FOR DELETE TO PUBLIC USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "job_vacancies_insert_business_owner" ON public.job_vacancies;
CREATE POLICY "job_vacancies_insert_business_owner" ON public.job_vacancies AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "job_vacancies_select_all" ON public.job_vacancies;
CREATE POLICY "job_vacancies_select_all" ON public.job_vacancies AS PERMISSIVE FOR SELECT TO PUBLIC USING ((((status)::text = ANY (ARRAY['active'::text, 'open'::text])) OR (business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()) UNION SELECT business_employees.business_id FROM business_employees WHERE (business_employees.employee_id = auth.uid())))));

DROP POLICY IF EXISTS "job_vacancies_update_business_owner" ON public.job_vacancies;
CREATE POLICY "job_vacancies_update_business_owner" ON public.job_vacancies AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid())))) WITH CHECK ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

-- location_expense_config
DROP POLICY IF EXISTS "location_expense_config_admin_delete" ON public.location_expense_config;
CREATE POLICY "location_expense_config_admin_delete" ON public.location_expense_config AS PERMISSIVE FOR DELETE TO PUBLIC USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "location_expense_config_admin_insert" ON public.location_expense_config;
CREATE POLICY "location_expense_config_admin_insert" ON public.location_expense_config AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "location_expense_config_admin_select" ON public.location_expense_config;
CREATE POLICY "location_expense_config_admin_select" ON public.location_expense_config AS PERMISSIVE FOR SELECT TO PUBLIC USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "location_expense_config_admin_update" ON public.location_expense_config;
CREATE POLICY "location_expense_config_admin_update" ON public.location_expense_config AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid())))) WITH CHECK ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

-- location_media
DROP POLICY IF EXISTS "Members can delete their location media" ON public.location_media;
CREATE POLICY "Members can delete their location media" ON public.location_media AS PERMISSIVE FOR DELETE TO PUBLIC USING (can_manage_location_media(location_id));

DROP POLICY IF EXISTS "Members can insert location media" ON public.location_media;
CREATE POLICY "Members can insert location media" ON public.location_media AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (can_manage_location_media(location_id));

DROP POLICY IF EXISTS "Members can update their location media" ON public.location_media;
CREATE POLICY "Members can update their location media" ON public.location_media AS PERMISSIVE FOR UPDATE TO PUBLIC USING (can_manage_location_media(location_id)) WITH CHECK (can_manage_location_media(location_id));

DROP POLICY IF EXISTS "Users can view location media" ON public.location_media;
CREATE POLICY "Users can view location media" ON public.location_media AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

-- location_services
DROP POLICY IF EXISTS "Employees can read business location services" ON public.location_services;
CREATE POLICY "Employees can read business location services" ON public.location_services AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() IN ( SELECT be.employee_id FROM (business_employees be JOIN locations l ON ((be.business_id = l.business_id))) WHERE ((l.id = location_services.location_id) AND (be.status = 'approved'::employee_status)))));

DROP POLICY IF EXISTS "Owners can manage location services" ON public.location_services;
CREATE POLICY "Owners can manage location services" ON public.location_services AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() IN ( SELECT b.owner_id FROM (businesses b JOIN locations l ON ((b.id = l.business_id))) WHERE (l.id = location_services.location_id))));

DROP POLICY IF EXISTS "Public can read active location services" ON public.location_services;
CREATE POLICY "Public can read active location services" ON public.location_services AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_active = true));

-- locations
DROP POLICY IF EXISTS "delete_locations" ON public.locations;
CREATE POLICY "delete_locations" ON public.locations AS PERMISSIVE FOR DELETE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = locations.business_id) AND (b.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "insert_locations" ON public.locations;
CREATE POLICY "insert_locations" ON public.locations AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = locations.business_id) AND (b.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "sel_locations" ON public.locations;
CREATE POLICY "sel_locations" ON public.locations AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_active = true));

DROP POLICY IF EXISTS "update_locations" ON public.locations;
CREATE POLICY "update_locations" ON public.locations AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = locations.business_id) AND (b.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = locations.business_id) AND (b.owner_id = auth.uid())))));
