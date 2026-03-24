-- RLS Policies Part 2 (login_logs → work_schedules)
-- Applied to PROD on 2026-03-24

-- login_logs
DROP POLICY IF EXISTS "Admins can view all login logs" ON public.login_logs;
CREATE POLICY "Admins can view all login logs" ON public.login_logs AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "Service can insert login logs" ON public.login_logs;
CREATE POLICY "Service can insert login logs" ON public.login_logs AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own login logs" ON public.login_logs;
CREATE POLICY "Users can view their own login logs" ON public.login_logs AS PERMISSIVE FOR SELECT TO PUBLIC USING ((user_id = auth.uid()));

-- messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages" ON public.messages AS PERMISSIVE FOR DELETE TO PUBLIC USING ((sender_id = auth.uid()));

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations" ON public.messages AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM conversation_members WHERE ((conversation_members.conversation_id = messages.conversation_id) AND (conversation_members.user_id = auth.uid()))))));

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((sender_id = auth.uid())) WITH CHECK ((sender_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1 FROM conversation_members WHERE ((conversation_members.conversation_id = messages.conversation_id) AND (conversation_members.user_id = auth.uid())))));

-- notification_log
DROP POLICY IF EXISTS "notification_log_select_policy" ON public.notification_log;
CREATE POLICY "notification_log_select_policy" ON public.notification_log AS PERMISSIVE FOR SELECT TO PUBLIC USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()) UNION SELECT business_employees.business_id FROM business_employees WHERE (business_employees.employee_id = auth.uid()))));

DROP POLICY IF EXISTS "notification_log_service_policy" ON public.notification_log;
CREATE POLICY "notification_log_service_policy" ON public.notification_log AS PERMISSIVE FOR ALL TO PUBLIC USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "ins_notifications_system" ON public.notifications;
CREATE POLICY "ins_notifications_system" ON public.notifications AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (true);

DROP POLICY IF EXISTS "sel_notifications_self" ON public.notifications;
CREATE POLICY "sel_notifications_self" ON public.notifications AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "upd_notifications_self" ON public.notifications;
CREATE POLICY "upd_notifications_self" ON public.notifications AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = user_id));

-- payment_methods
DROP POLICY IF EXISTS "Business admins can view payment methods" ON public.payment_methods;
CREATE POLICY "Business admins can view payment methods" ON public.payment_methods AS PERMISSIVE FOR SELECT TO PUBLIC USING (is_business_admin(business_id));

DROP POLICY IF EXISTS "Business owners can delete payment methods" ON public.payment_methods;
CREATE POLICY "Business owners can delete payment methods" ON public.payment_methods AS PERMISSIVE FOR DELETE TO PUBLIC USING (is_business_owner(business_id));

DROP POLICY IF EXISTS "Business owners can insert payment methods" ON public.payment_methods;
CREATE POLICY "Business owners can insert payment methods" ON public.payment_methods AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (is_business_owner(business_id));

DROP POLICY IF EXISTS "Business owners can update payment methods" ON public.payment_methods;
CREATE POLICY "Business owners can update payment methods" ON public.payment_methods AS PERMISSIVE FOR UPDATE TO PUBLIC USING (is_business_owner(business_id)) WITH CHECK (is_business_owner(business_id));

DROP POLICY IF EXISTS "Service role has full access to payment methods" ON public.payment_methods;
CREATE POLICY "Service role has full access to payment methods" ON public.payment_methods AS PERMISSIVE FOR ALL TO PUBLIC USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text)) WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- payroll_configuration
DROP POLICY IF EXISTS "Business owners can manage payroll config" ON public.payroll_configuration;
CREATE POLICY "Business owners can manage payroll config" ON public.payroll_configuration AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses WHERE ((businesses.id = payroll_configuration.business_id) AND (businesses.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "Business owners can view payroll config" ON public.payroll_configuration;
CREATE POLICY "Business owners can view payroll config" ON public.payroll_configuration AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses WHERE ((businesses.id = payroll_configuration.business_id) AND (businesses.owner_id = auth.uid())))));

-- payroll_payments
DROP POLICY IF EXISTS "Business owners can manage payroll payments" ON public.payroll_payments;
CREATE POLICY "Business owners can manage payroll payments" ON public.payroll_payments AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses WHERE ((businesses.id = payroll_payments.business_id) AND (businesses.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "Business owners can view payroll payments" ON public.payroll_payments;
CREATE POLICY "Business owners can view payroll payments" ON public.payroll_payments AS PERMISSIVE FOR SELECT TO PUBLIC USING (((EXISTS ( SELECT 1 FROM businesses WHERE ((businesses.id = payroll_payments.business_id) AND (businesses.owner_id = auth.uid())))) OR (employee_id = auth.uid())));

-- permission_audit_log
DROP POLICY IF EXISTS "permission_audit_log_insert" ON public.permission_audit_log;
CREATE POLICY "permission_audit_log_insert" ON public.permission_audit_log AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (true);

DROP POLICY IF EXISTS "permission_audit_log_select" ON public.permission_audit_log;
CREATE POLICY "permission_audit_log_select" ON public.permission_audit_log AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1 FROM user_permissions up WHERE ((up.user_id = auth.uid()) AND (up.business_id = permission_audit_log.business_id) AND (up.permission = 'permissions.view'::text) AND (up.is_active = true))))));

-- permission_templates
DROP POLICY IF EXISTS "permission_templates_delete" ON public.permission_templates;
CREATE POLICY "permission_templates_delete" ON public.permission_templates AS PERMISSIVE FOR DELETE TO PUBLIC USING (((is_system_template = false) AND (is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1 FROM user_permissions up WHERE ((up.user_id = auth.uid()) AND (up.business_id = permission_templates.business_id) AND (up.permission = 'permissions.modify'::text) AND (up.is_active = true)))))));

DROP POLICY IF EXISTS "permission_templates_insert" ON public.permission_templates;
CREATE POLICY "permission_templates_insert" ON public.permission_templates AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1 FROM get_user_permissions(auth.uid(), permission_templates.business_id) p(permission) WHERE (p.permission = 'permissions.modify'::text)))));

DROP POLICY IF EXISTS "permission_templates_select" ON public.permission_templates;
CREATE POLICY "permission_templates_select" ON public.permission_templates AS PERMISSIVE FOR SELECT TO PUBLIC USING (((is_system_template = true) OR is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1 FROM get_user_permissions(auth.uid(), permission_templates.business_id) p(permission) WHERE (p.permission = 'permissions.view'::text)))));

DROP POLICY IF EXISTS "permission_templates_update" ON public.permission_templates;
CREATE POLICY "permission_templates_update" ON public.permission_templates AS PERMISSIVE FOR UPDATE TO PUBLIC USING (((is_system_template = false) AND (is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1 FROM get_user_permissions(auth.uid(), permission_templates.business_id) p(permission) WHERE (p.permission = 'permissions.modify'::text)))))) WITH CHECK (((is_system_template = false) AND (is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1 FROM get_user_permissions(auth.uid(), permission_templates.business_id) p(permission) WHERE (p.permission = 'permissions.modify'::text))))));

-- profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = id));

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = id));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

DROP POLICY IF EXISTS "ins_profiles" ON public.profiles;
CREATE POLICY "ins_profiles" ON public.profiles AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = id));

DROP POLICY IF EXISTS "sel_profiles" ON public.profiles;
CREATE POLICY "sel_profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = id));

DROP POLICY IF EXISTS "sel_profiles_public_read" ON public.profiles;
CREATE POLICY "sel_profiles_public_read" ON public.profiles AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_active = true));

DROP POLICY IF EXISTS "upd_profiles" ON public.profiles;
CREATE POLICY "upd_profiles" ON public.profiles AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

-- public_holidays
DROP POLICY IF EXISTS "Allow admin manage holidays" ON public.public_holidays;
CREATE POLICY "Allow admin manage holidays" ON public.public_holidays AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses WHERE (businesses.owner_id = auth.uid()) LIMIT 1)));

DROP POLICY IF EXISTS "Allow public read for all users" ON public.public_holidays;
CREATE POLICY "Allow public read for all users" ON public.public_holidays AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

-- recurring_expenses
DROP POLICY IF EXISTS "Business owners can delete recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Business owners can delete recurring expenses" ON public.recurring_expenses AS PERMISSIVE FOR DELETE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses WHERE ((businesses.id = recurring_expenses.business_id) AND (businesses.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "Business owners can insert recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Business owners can insert recurring expenses" ON public.recurring_expenses AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((EXISTS ( SELECT 1 FROM businesses WHERE ((businesses.id = recurring_expenses.business_id) AND (businesses.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "Business owners can update recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Business owners can update recurring expenses" ON public.recurring_expenses AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses WHERE ((businesses.id = recurring_expenses.business_id) AND (businesses.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1 FROM businesses WHERE ((businesses.id = recurring_expenses.business_id) AND (businesses.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "Users can view their business recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can view their business recurring expenses" ON public.recurring_expenses AS PERMISSIVE FOR SELECT TO PUBLIC USING (((EXISTS ( SELECT 1 FROM businesses WHERE ((businesses.id = recurring_expenses.business_id) AND (businesses.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1 FROM business_employees WHERE ((business_employees.business_id = recurring_expenses.business_id) AND (business_employees.employee_id = auth.uid()))))));

-- regions
DROP POLICY IF EXISTS "Public read access to regions" ON public.regions;
CREATE POLICY "Public read access to regions" ON public.regions AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

-- resource_services
DROP POLICY IF EXISTS "Business owners can manage resource services" ON public.resource_services;
CREATE POLICY "Business owners can manage resource services" ON public.resource_services AS PERMISSIVE FOR ALL TO PUBLIC USING ((resource_id IN ( SELECT business_resources.id FROM business_resources WHERE (business_resources.business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))))));

DROP POLICY IF EXISTS "Public can view active resource services" ON public.resource_services;
CREATE POLICY "Public can view active resource services" ON public.resource_services AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_active = true));

-- reviews
DROP POLICY IF EXISTS "Clients can create review for own appointment" ON public.reviews;
CREATE POLICY "Clients can create review for own appointment" ON public.reviews AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((auth.uid() = client_id) AND (auth.uid() IN ( SELECT appointments.client_id FROM appointments WHERE ((appointments.id = reviews.appointment_id) AND (appointments.status = 'completed'::appointment_status))))));

DROP POLICY IF EXISTS "Clients can manage own reviews" ON public.reviews;
CREATE POLICY "Clients can manage own reviews" ON public.reviews AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() = client_id));

DROP POLICY IF EXISTS "Employees can read reviews about them" ON public.reviews;
CREATE POLICY "Employees can read reviews about them" ON public.reviews AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = employee_id));

DROP POLICY IF EXISTS "Owners can manage business reviews" ON public.reviews;
CREATE POLICY "Owners can manage business reviews" ON public.reviews AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() IN ( SELECT businesses.owner_id FROM businesses WHERE (businesses.id = reviews.business_id))));

DROP POLICY IF EXISTS "Public can read visible reviews" ON public.reviews;
CREATE POLICY "Public can read visible reviews" ON public.reviews AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_visible = true));

-- services
DROP POLICY IF EXISTS "owners_manage_services" ON public.services;
CREATE POLICY "owners_manage_services" ON public.services AS PERMISSIVE FOR ALL TO authenticated USING ((business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()))));

DROP POLICY IF EXISTS "public_read_active_services" ON public.services;
CREATE POLICY "public_read_active_services" ON public.services AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_active = true));

DROP POLICY IF EXISTS "services_via_business" ON public.services;
CREATE POLICY "services_via_business" ON public.services AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = services.business_id) AND (b.owner_id = auth.uid())))));

-- subscription_events
DROP POLICY IF EXISTS "Business admins can view subscription events" ON public.subscription_events;
CREATE POLICY "Business admins can view subscription events" ON public.subscription_events AS PERMISSIVE FOR SELECT TO PUBLIC USING (is_business_admin(business_id));

DROP POLICY IF EXISTS "Service role can insert subscription events" ON public.subscription_events;
CREATE POLICY "Service role can insert subscription events" ON public.subscription_events AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- subscription_payments
DROP POLICY IF EXISTS "Business admins can view payments" ON public.subscription_payments;
CREATE POLICY "Business admins can view payments" ON public.subscription_payments AS PERMISSIVE FOR SELECT TO PUBLIC USING (is_business_admin(business_id));

DROP POLICY IF EXISTS "Service role has full access to payments" ON public.subscription_payments;
CREATE POLICY "Service role has full access to payments" ON public.subscription_payments AS PERMISSIVE FOR ALL TO PUBLIC USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text)) WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- system_config
DROP POLICY IF EXISTS "Only service role can modify system config" ON public.system_config;
CREATE POLICY "Only service role can modify system config" ON public.system_config AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Only service role can read system config" ON public.system_config;
CREATE POLICY "Only service role can read system config" ON public.system_config AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.role() = 'service_role'::text));

-- tax_configurations
DROP POLICY IF EXISTS "Owners can manage tax configurations" ON public.tax_configurations;
CREATE POLICY "Owners can manage tax configurations" ON public.tax_configurations AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() IN ( SELECT businesses.owner_id FROM businesses WHERE (businesses.id = tax_configurations.business_id))));

-- tax_liabilities
DROP POLICY IF EXISTS "Owners can manage tax liabilities" ON public.tax_liabilities;
CREATE POLICY "Owners can manage tax liabilities" ON public.tax_liabilities AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() IN ( SELECT businesses.owner_id FROM businesses WHERE (businesses.id = tax_liabilities.business_id))));

-- transactions
DROP POLICY IF EXISTS "Managers can read location transactions" ON public.transactions;
CREATE POLICY "Managers can read location transactions" ON public.transactions AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() IN ( SELECT be.employee_id FROM business_employees be WHERE ((be.business_id = transactions.business_id) AND (be.role = 'manager'::text) AND (be.status = 'approved'::employee_status)))));

DROP POLICY IF EXISTS "Owners can manage transactions" ON public.transactions;
CREATE POLICY "Owners can manage transactions" ON public.transactions AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() IN ( SELECT businesses.owner_id FROM businesses WHERE (businesses.id = transactions.business_id))));

-- usage_metrics
DROP POLICY IF EXISTS "Business admins can view usage metrics" ON public.usage_metrics;
CREATE POLICY "Business admins can view usage metrics" ON public.usage_metrics AS PERMISSIVE FOR SELECT TO PUBLIC USING (is_business_admin(business_id));

DROP POLICY IF EXISTS "Service role has full access to usage metrics" ON public.usage_metrics;
CREATE POLICY "Service role has full access to usage metrics" ON public.usage_metrics AS PERMISSIVE FOR ALL TO PUBLIC USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text)) WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- user_notification_preferences
DROP POLICY IF EXISTS "user_notification_preferences_delete_own" ON public.user_notification_preferences;
CREATE POLICY "user_notification_preferences_delete_own" ON public.user_notification_preferences AS PERMISSIVE FOR DELETE TO PUBLIC USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "user_notification_preferences_insert_own" ON public.user_notification_preferences;
CREATE POLICY "user_notification_preferences_insert_own" ON public.user_notification_preferences AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "user_notification_preferences_select_own" ON public.user_notification_preferences;
CREATE POLICY "user_notification_preferences_select_own" ON public.user_notification_preferences AS PERMISSIVE FOR SELECT TO PUBLIC USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "user_notification_preferences_update_own" ON public.user_notification_preferences;
CREATE POLICY "user_notification_preferences_update_own" ON public.user_notification_preferences AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

-- user_permissions
DROP POLICY IF EXISTS "user_permissions_delete_v2" ON public.user_permissions;
CREATE POLICY "user_permissions_delete_v2" ON public.user_permissions AS PERMISSIVE FOR DELETE TO PUBLIC USING ((is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1 FROM business_roles br WHERE ((br.user_id = auth.uid()) AND (br.business_id = user_permissions.business_id) AND (br.role = 'admin'::text) AND (br.is_active = true))))));

DROP POLICY IF EXISTS "user_permissions_insert_v2" ON public.user_permissions;
CREATE POLICY "user_permissions_insert_v2" ON public.user_permissions AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1 FROM business_roles br WHERE ((br.user_id = auth.uid()) AND (br.business_id = user_permissions.business_id) AND (br.role = 'admin'::text) AND (br.is_active = true))))));

DROP POLICY IF EXISTS "user_permissions_select_v2" ON public.user_permissions;
CREATE POLICY "user_permissions_select_v2" ON public.user_permissions AS PERMISSIVE FOR SELECT TO PUBLIC USING ((is_business_owner(auth.uid(), business_id) OR (user_id = auth.uid()) OR (EXISTS ( SELECT 1 FROM business_roles br WHERE ((br.user_id = auth.uid()) AND (br.business_id = user_permissions.business_id) AND (br.role = 'admin'::text) AND (br.is_active = true))))));

DROP POLICY IF EXISTS "user_permissions_update_v2" ON public.user_permissions;
CREATE POLICY "user_permissions_update_v2" ON public.user_permissions AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1 FROM business_roles br WHERE ((br.user_id = auth.uid()) AND (br.business_id = user_permissions.business_id) AND (br.role = 'admin'::text) AND (br.is_active = true)))))) WITH CHECK ((is_business_owner(auth.uid(), business_id) OR (EXISTS ( SELECT 1 FROM business_roles br WHERE ((br.user_id = auth.uid()) AND (br.business_id = user_permissions.business_id) AND (br.role = 'admin'::text) AND (br.is_active = true))))));

-- vacation_balance
DROP POLICY IF EXISTS "Admins can update vacation balances" ON public.vacation_balance;
CREATE POLICY "Admins can update vacation balances" ON public.vacation_balance AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = vacation_balance.business_id) AND (b.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = vacation_balance.business_id) AND (b.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "Admins can view all vacation balances" ON public.vacation_balance;
CREATE POLICY "Admins can view all vacation balances" ON public.vacation_balance AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1 FROM businesses b WHERE ((b.id = vacation_balance.business_id) AND (b.owner_id = auth.uid())))));

DROP POLICY IF EXISTS "Employees can update their vacation balance" ON public.vacation_balance;
CREATE POLICY "Employees can update their vacation balance" ON public.vacation_balance AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1 FROM business_employees WHERE ((business_employees.employee_id = auth.uid()) AND (business_employees.business_id = vacation_balance.business_id))))) WITH CHECK ((EXISTS ( SELECT 1 FROM business_employees WHERE ((business_employees.employee_id = auth.uid()) AND (business_employees.business_id = vacation_balance.business_id)))));

DROP POLICY IF EXISTS "Employees can view their own vacation balance" ON public.vacation_balance;
CREATE POLICY "Employees can view their own vacation balance" ON public.vacation_balance AS PERMISSIVE FOR SELECT TO PUBLIC USING ((employee_id = auth.uid()));

DROP POLICY IF EXISTS "Employees can view their vacation balance" ON public.vacation_balance;
CREATE POLICY "Employees can view their vacation balance" ON public.vacation_balance AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1 FROM business_employees WHERE ((business_employees.employee_id = auth.uid()) AND (business_employees.business_id = vacation_balance.business_id)))));

DROP POLICY IF EXISTS "System can insert vacation balances" ON public.vacation_balance;
CREATE POLICY "System can insert vacation balances" ON public.vacation_balance AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (true);

-- work_schedules
DROP POLICY IF EXISTS "Admins can view employee schedules" ON public.work_schedules;
CREATE POLICY "Admins can view employee schedules" ON public.work_schedules AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1 FROM business_employees be WHERE ((be.employee_id = work_schedules.employee_id) AND (be.business_id IN ( SELECT businesses.id FROM businesses WHERE (businesses.owner_id = auth.uid()) UNION SELECT business_roles.business_id FROM business_roles WHERE ((business_roles.user_id = auth.uid()) AND (business_roles.role = 'admin'::text))))))));

DROP POLICY IF EXISTS "Employees can delete own schedules" ON public.work_schedules;
CREATE POLICY "Employees can delete own schedules" ON public.work_schedules AS PERMISSIVE FOR DELETE TO PUBLIC USING ((auth.uid() = employee_id));

DROP POLICY IF EXISTS "Employees can insert own schedules" ON public.work_schedules;
CREATE POLICY "Employees can insert own schedules" ON public.work_schedules AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = employee_id));

DROP POLICY IF EXISTS "Employees can update own schedules" ON public.work_schedules;
CREATE POLICY "Employees can update own schedules" ON public.work_schedules AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = employee_id)) WITH CHECK ((auth.uid() = employee_id));

DROP POLICY IF EXISTS "Employees can view own schedules" ON public.work_schedules;
CREATE POLICY "Employees can view own schedules" ON public.work_schedules AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = employee_id));
