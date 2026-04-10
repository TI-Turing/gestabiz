-- =============================================================================
-- Migration: PROD Triggers
-- Idempotent: DROP TRIGGER IF EXISTS + CREATE TRIGGER
-- Generated from DEV pg_trigger with correct tgtype bitwise analysis
-- Total: 108 triggers across 46 tables
-- =============================================================================

-- ========================
-- auth.users
-- ========================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================
-- public.appointments
-- ========================

DROP TRIGGER IF EXISTS appointments_set_confirmation_deadline ON public.appointments;
CREATE TRIGGER appointments_set_confirmation_deadline
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_confirmation_deadline();

DROP TRIGGER IF EXISTS check_appointment_conflict_trigger ON public.appointments;
CREATE TRIGGER check_appointment_conflict_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_appointment_conflict();

DROP TRIGGER IF EXISTS create_appointment_reminders_trigger ON public.appointments;
CREATE TRIGGER create_appointment_reminders_trigger
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_appointment_reminders();

DROP TRIGGER IF EXISTS create_appointment_transaction_trigger ON public.appointments;
CREATE TRIGGER create_appointment_transaction_trigger
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_appointment_transaction();

DROP TRIGGER IF EXISTS notify_on_appointment_created ON public.appointments;
CREATE TRIGGER notify_on_appointment_created
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_appointment_created();

DROP TRIGGER IF EXISTS refresh_appointments_view ON public.appointments;
CREATE TRIGGER refresh_appointments_view
  AFTER INSERT OR DELETE OR UPDATE ON public.appointments
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_appointments_with_relations();

DROP TRIGGER IF EXISTS trigger_calculate_appointment_amounts ON public.appointments;
CREATE TRIGGER trigger_calculate_appointment_amounts
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_appointment_amounts();

DROP TRIGGER IF EXISTS trigger_set_appointment_completed_at ON public.appointments;
CREATE TRIGGER trigger_set_appointment_completed_at
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_appointment_completed_at();

DROP TRIGGER IF EXISTS trigger_track_first_client ON public.appointments;
CREATE TRIGGER trigger_track_first_client
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.track_first_client();

DROP TRIGGER IF EXISTS trigger_update_business_activity_on_appointment ON public.appointments;
CREATE TRIGGER trigger_update_business_activity_on_appointment
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_activity();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_appointment_count_trigger ON public.appointments;
CREATE TRIGGER update_business_appointment_count_trigger
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_appointment_count();

-- ========================
-- public.bug_reports
-- ========================

DROP TRIGGER IF EXISTS update_bug_reports_updated_at_trigger ON public.bug_reports;
CREATE TRIGGER update_bug_reports_updated_at_trigger
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bug_reports_updated_at();

-- ========================
-- public.business_employees
-- ========================

DROP TRIGGER IF EXISTS trg_business_employees_sync_roles_insert ON public.business_employees;
CREATE TRIGGER trg_business_employees_sync_roles_insert
  AFTER INSERT ON public.business_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_business_roles_from_business_employees();

DROP TRIGGER IF EXISTS trg_business_employees_sync_roles_update ON public.business_employees;
CREATE TRIGGER trg_business_employees_sync_roles_update
  AFTER UPDATE ON public.business_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_business_roles_from_business_employees();

DROP TRIGGER IF EXISTS trg_sync_business_roles_from_business_employees ON public.business_employees;
CREATE TRIGGER trg_sync_business_roles_from_business_employees
  AFTER INSERT OR UPDATE ON public.business_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_business_roles_from_business_employees();

DROP TRIGGER IF EXISTS trg_update_business_config_on_employee_status ON public.business_employees;
CREATE TRIGGER trg_update_business_config_on_employee_status
  AFTER UPDATE ON public.business_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_business_config_on_employee_status();

DROP TRIGGER IF EXISTS trigger_cleanup_completed_transfer ON public.business_employees;
CREATE TRIGGER trigger_cleanup_completed_transfer
  BEFORE UPDATE ON public.business_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_completed_transfer();

DROP TRIGGER IF EXISTS trigger_initialize_vacation_balance ON public.business_employees;
CREATE TRIGGER trigger_initialize_vacation_balance
  AFTER INSERT ON public.business_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_vacation_balance();

DROP TRIGGER IF EXISTS update_business_employees_updated_at ON public.business_employees;
CREATE TRIGGER update_business_employees_updated_at
  BEFORE UPDATE ON public.business_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.business_notification_settings
-- ========================

DROP TRIGGER IF EXISTS trigger_update_business_notification_settings_updated_at ON public.business_notification_settings;
CREATE TRIGGER trigger_update_business_notification_settings_updated_at
  BEFORE UPDATE ON public.business_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_notification_settings_updated_at();

-- ========================
-- public.business_resources
-- ========================

DROP TRIGGER IF EXISTS trg_update_business_config_on_resource_status ON public.business_resources;
CREATE TRIGGER trg_update_business_config_on_resource_status
  AFTER UPDATE ON public.business_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_business_config_on_resource_status();

DROP TRIGGER IF EXISTS trigger_update_business_resources_updated_at ON public.business_resources;
CREATE TRIGGER trigger_update_business_resources_updated_at
  BEFORE UPDATE ON public.business_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_resources_updated_at();

-- ========================
-- public.business_roles
-- ========================

DROP TRIGGER IF EXISTS enforce_owner_hierarchy_trigger ON public.business_roles;
CREATE TRIGGER enforce_owner_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON public.business_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_owner_hierarchy();

DROP TRIGGER IF EXISTS trg_auto_assign_permissions_to_admin ON public.business_roles;
CREATE TRIGGER trg_auto_assign_permissions_to_admin
  AFTER INSERT OR UPDATE ON public.business_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_permissions_to_admin();

DROP TRIGGER IF EXISTS trg_auto_insert_admin_as_employee ON public.business_roles;
CREATE TRIGGER trg_auto_insert_admin_as_employee
  AFTER INSERT OR UPDATE ON public.business_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_insert_admin_as_employee();

DROP TRIGGER IF EXISTS trigger_audit_business_roles ON public.business_roles;
CREATE TRIGGER trigger_audit_business_roles
  AFTER INSERT OR DELETE OR UPDATE ON public.business_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_business_roles_changes();

DROP TRIGGER IF EXISTS validate_hierarchy_no_cycles_trigger ON public.business_roles;
CREATE TRIGGER validate_hierarchy_no_cycles_trigger
  BEFORE INSERT OR UPDATE ON public.business_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_hierarchy_no_cycles();

-- ========================
-- public.business_subcategories
-- ========================

DROP TRIGGER IF EXISTS trigger_check_max_subcategories ON public.business_subcategories;
CREATE TRIGGER trigger_check_max_subcategories
  BEFORE INSERT ON public.business_subcategories
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_subcategories();

-- ========================
-- public.businesses
-- ========================

DROP TRIGGER IF EXISTS businesses_search_vector_update_trigger ON public.businesses;
CREATE TRIGGER businesses_search_vector_update_trigger
  BEFORE INSERT OR UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.businesses_search_vector_update();

DROP TRIGGER IF EXISTS refresh_appointments_view_from_businesses ON public.businesses;
CREATE TRIGGER refresh_appointments_view_from_businesses
  AFTER UPDATE ON public.businesses
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_appointments_with_relations();

DROP TRIGGER IF EXISTS trg_auto_assign_permissions_to_owner ON public.businesses;
CREATE TRIGGER trg_auto_assign_permissions_to_owner
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_permissions_to_owner();

DROP TRIGGER IF EXISTS trg_auto_insert_owner_to_business_employees ON public.businesses;
CREATE TRIGGER trg_auto_insert_owner_to_business_employees
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_insert_owner_to_business_employees();

DROP TRIGGER IF EXISTS trigger_auto_generate_invitation_code ON public.businesses;
CREATE TRIGGER trigger_auto_generate_invitation_code
  BEFORE INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_invitation_code();

DROP TRIGGER IF EXISTS trigger_auto_insert_owner_to_business_employees ON public.businesses;
CREATE TRIGGER trigger_auto_insert_owner_to_business_employees
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_insert_owner_to_business_employees();

DROP TRIGGER IF EXISTS trigger_auto_insert_owner_to_business_roles ON public.businesses;
CREATE TRIGGER trigger_auto_insert_owner_to_business_roles
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_insert_owner_to_business_roles();

DROP TRIGGER IF EXISTS trigger_create_business_notification_settings ON public.businesses;
CREATE TRIGGER trigger_create_business_notification_settings
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_business_notification_settings();

DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.chat_conversations
-- ========================

DROP TRIGGER IF EXISTS trigger_update_chat_conversations_updated_at ON public.chat_conversations;
CREATE TRIGGER trigger_update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_updated_at();

DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON public.chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.chat_conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.chat_messages
-- ========================

DROP TRIGGER IF EXISTS trigger_delete_message_attachments ON public.chat_messages;
CREATE TRIGGER trigger_delete_message_attachments
  AFTER UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_message_attachments();

DROP TRIGGER IF EXISTS trigger_notify_new_chat_message ON public.chat_messages;
CREATE TRIGGER trigger_notify_new_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_chat_message();

DROP TRIGGER IF EXISTS trigger_update_chat_messages_updated_at ON public.chat_messages;
CREATE TRIGGER trigger_update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_updated_at();

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.chat_messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.chat_participants
-- ========================

DROP TRIGGER IF EXISTS trigger_update_chat_participants_updated_at ON public.chat_participants;
CREATE TRIGGER trigger_update_chat_participants_updated_at
  BEFORE UPDATE ON public.chat_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_updated_at();

DROP TRIGGER IF EXISTS update_chat_participants_updated_at ON public.chat_participants;
CREATE TRIGGER update_chat_participants_updated_at
  BEFORE UPDATE ON public.chat_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.conversation_members
-- ========================

DROP TRIGGER IF EXISTS trg_validate_direct_members ON public.conversation_members;
CREATE TRIGGER trg_validate_direct_members
  BEFORE INSERT ON public.conversation_members
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_direct_conversation_members();

-- ========================
-- public.conversations
-- ========================

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_updated_at();

-- ========================
-- public.cron_execution_logs
-- ========================

DROP TRIGGER IF EXISTS trigger_cleanup_cron_logs ON public.cron_execution_logs;
CREATE TRIGGER trigger_cleanup_cron_logs
  AFTER INSERT ON public.cron_execution_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_cron_logs();

-- ========================
-- public.discount_code_uses
-- ========================

DROP TRIGGER IF EXISTS trigger_increment_discount_code_uses ON public.discount_code_uses;
CREATE TRIGGER trigger_increment_discount_code_uses
  AFTER INSERT ON public.discount_code_uses
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_discount_code_uses();

-- ========================
-- public.discount_codes
-- ========================

DROP TRIGGER IF EXISTS trigger_update_discount_codes_updated_at ON public.discount_codes;
CREATE TRIGGER trigger_update_discount_codes_updated_at
  BEFORE UPDATE ON public.discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_discount_codes_updated_at();

-- ========================
-- public.employee_absences
-- ========================

DROP TRIGGER IF EXISTS trigger_update_vacation_balance ON public.employee_absences;
CREATE TRIGGER trigger_update_vacation_balance
  AFTER INSERT OR UPDATE ON public.employee_absences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vacation_balance_on_absence();

-- ========================
-- public.employee_join_requests
-- ========================

DROP TRIGGER IF EXISTS trg_employee_join_requests_updated_at ON public.employee_join_requests;
CREATE TRIGGER trg_employee_join_requests_updated_at
  BEFORE UPDATE ON public.employee_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employee_join_requests_updated_at();

-- ========================
-- public.employee_profiles
-- ========================

DROP TRIGGER IF EXISTS employee_profiles_updated_at ON public.employee_profiles;
CREATE TRIGGER employee_profiles_updated_at
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employee_profile_timestamp();

-- ========================
-- public.employee_services
-- ========================

DROP TRIGGER IF EXISTS trg_update_business_config_on_employee_service ON public.employee_services;
CREATE TRIGGER trg_update_business_config_on_employee_service
  AFTER INSERT OR DELETE ON public.employee_services
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_business_config_on_employee_service();

DROP TRIGGER IF EXISTS update_employee_services_updated_at ON public.employee_services;
CREATE TRIGGER update_employee_services_updated_at
  BEFORE UPDATE ON public.employee_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS validate_employee_service_location_trigger ON public.employee_services;
CREATE TRIGGER validate_employee_service_location_trigger
  BEFORE INSERT OR UPDATE ON public.employee_services
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_employee_service_location();

-- ========================
-- public.error_logs
-- ========================

DROP TRIGGER IF EXISTS update_error_logs_updated_at ON public.error_logs;
CREATE TRIGGER update_error_logs_updated_at
  BEFORE UPDATE ON public.error_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.in_app_notifications
-- ========================

DROP TRIGGER IF EXISTS trg_notify_business_unconfigured ON public.in_app_notifications;
CREATE TRIGGER trg_notify_business_unconfigured
  AFTER INSERT ON public.in_app_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_business_unconfigured();

DROP TRIGGER IF EXISTS trigger_cleanup_expired_notifications ON public.in_app_notifications;
CREATE TRIGGER trigger_cleanup_expired_notifications
  AFTER INSERT ON public.in_app_notifications
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_notifications();

-- ========================
-- public.invoices
-- ========================

DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON public.invoices;
CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invoice_number();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.job_applications
-- ========================

DROP TRIGGER IF EXISTS on_job_application_created ON public.job_applications;
CREATE TRIGGER on_job_application_created
  AFTER INSERT ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_business_on_application();

DROP TRIGGER IF EXISTS trg_auto_reject_on_filled ON public.job_applications;
CREATE TRIGGER trg_auto_reject_on_filled
  AFTER UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_reject_candidates_on_vacancy_filled();

DROP TRIGGER IF EXISTS trg_validate_application_status ON public.job_applications;
CREATE TRIGGER trg_validate_application_status
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_application_status_transition();

DROP TRIGGER IF EXISTS trigger_increment_vacancy_applications ON public.job_applications;
CREATE TRIGGER trigger_increment_vacancy_applications
  AFTER INSERT ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_vacancy_applications_count();

DROP TRIGGER IF EXISTS trigger_update_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER trigger_update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_applications_updated_at();

-- ========================
-- public.job_vacancies
-- ========================

DROP TRIGGER IF EXISTS trigger_update_job_vacancies_updated_at ON public.job_vacancies;
CREATE TRIGGER trigger_update_job_vacancies_updated_at
  BEFORE UPDATE ON public.job_vacancies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_vacancies_updated_at();

-- ========================
-- public.location_expense_config
-- ========================

DROP TRIGGER IF EXISTS trigger_location_expense_config_updated_at ON public.location_expense_config;
CREATE TRIGGER trigger_location_expense_config_updated_at
  BEFORE UPDATE ON public.location_expense_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_location_expense_config_updated_at();

-- ========================
-- public.location_services
-- ========================

DROP TRIGGER IF EXISTS trg_update_business_config_on_location_service ON public.location_services;
CREATE TRIGGER trg_update_business_config_on_location_service
  AFTER INSERT OR DELETE ON public.location_services
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_business_config_on_location_service();

DROP TRIGGER IF EXISTS update_location_services_updated_at ON public.location_services;
CREATE TRIGGER update_location_services_updated_at
  BEFORE UPDATE ON public.location_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.locations
-- ========================

DROP TRIGGER IF EXISTS refresh_appointments_view_from_locations ON public.locations;
CREATE TRIGGER refresh_appointments_view_from_locations
  AFTER UPDATE ON public.locations
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_appointments_with_relations();

DROP TRIGGER IF EXISTS trg_update_business_config_on_location ON public.locations;
CREATE TRIGGER trg_update_business_config_on_location
  AFTER INSERT OR DELETE OR UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_business_config_on_location();

DROP TRIGGER IF EXISTS trigger_ensure_single_primary_location ON public.locations;
CREATE TRIGGER trigger_ensure_single_primary_location
  BEFORE INSERT OR UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_primary_location();

DROP TRIGGER IF EXISTS update_locations_updated_at ON public.locations;
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.messages
-- ========================

DROP TRIGGER IF EXISTS trg_messages_increment_unread ON public.messages;
CREATE TRIGGER trg_messages_increment_unread
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_unread_on_message();

DROP TRIGGER IF EXISTS trg_messages_update_conversation ON public.messages;
CREATE TRIGGER trg_messages_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

DROP TRIGGER IF EXISTS trg_messages_update_delivery_status ON public.messages;
CREATE TRIGGER trg_messages_update_delivery_status
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_message_delivery_status();

DROP TRIGGER IF EXISTS update_message_search_vector_trigger ON public.messages;
CREATE TRIGGER update_message_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_message_search_vector();

-- ========================
-- public.payment_methods
-- ========================

DROP TRIGGER IF EXISTS trigger_ensure_single_default_payment_method ON public.payment_methods;
CREATE TRIGGER trigger_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_payment_method();

DROP TRIGGER IF EXISTS trigger_log_payment_method_changes ON public.payment_methods;
CREATE TRIGGER trigger_log_payment_method_changes
  AFTER INSERT OR DELETE OR UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payment_method_changes();

DROP TRIGGER IF EXISTS trigger_update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER trigger_update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_methods_updated_at();

-- ========================
-- public.payroll_configuration
-- ========================

DROP TRIGGER IF EXISTS trigger_update_payroll_config_updated_at ON public.payroll_configuration;
CREATE TRIGGER trigger_update_payroll_config_updated_at
  BEFORE UPDATE ON public.payroll_configuration
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payroll_config_updated_at();

-- ========================
-- public.payroll_payments
-- ========================

DROP TRIGGER IF EXISTS trigger_update_payroll_payments_updated_at ON public.payroll_payments;
CREATE TRIGGER trigger_update_payroll_payments_updated_at
  BEFORE UPDATE ON public.payroll_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payroll_payments_updated_at();

-- ========================
-- public.profiles
-- ========================

DROP TRIGGER IF EXISTS profiles_search_vector_update_trigger ON public.profiles;
CREATE TRIGGER profiles_search_vector_update_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_search_vector_update();

DROP TRIGGER IF EXISTS refresh_appointments_view_from_profiles ON public.profiles;
CREATE TRIGGER refresh_appointments_view_from_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_appointments_with_relations();

DROP TRIGGER IF EXISTS trigger_create_user_notification_preferences ON public.profiles;
CREATE TRIGGER trigger_create_user_notification_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_user_notification_preferences();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.public_holidays
-- ========================

DROP TRIGGER IF EXISTS trigger_public_holidays_updated_at ON public.public_holidays;
CREATE TRIGGER trigger_public_holidays_updated_at
  BEFORE UPDATE ON public.public_holidays
  FOR EACH ROW
  EXECUTE FUNCTION public.update_public_holidays_timestamp();

-- ========================
-- public.recurring_expenses
-- ========================

DROP TRIGGER IF EXISTS trigger_update_recurring_expenses_updated_at ON public.recurring_expenses;
CREATE TRIGGER trigger_update_recurring_expenses_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_recurring_expenses_updated_at();

-- ========================
-- public.resource_services
-- ========================

DROP TRIGGER IF EXISTS trg_update_business_config_on_resource_service ON public.resource_services;
CREATE TRIGGER trg_update_business_config_on_resource_service
  AFTER INSERT OR DELETE ON public.resource_services
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_business_config_on_resource_service();

-- ========================
-- public.reviews
-- ========================

DROP TRIGGER IF EXISTS update_business_review_stats_trigger ON public.reviews;
CREATE TRIGGER update_business_review_stats_trigger
  AFTER INSERT OR DELETE OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_review_stats();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS verify_review_on_insert_trigger ON public.reviews;
CREATE TRIGGER verify_review_on_insert_trigger
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_review_on_insert();

-- ========================
-- public.services
-- ========================

DROP TRIGGER IF EXISTS refresh_appointments_view_from_services ON public.services;
CREATE TRIGGER refresh_appointments_view_from_services
  AFTER UPDATE ON public.services
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_appointments_with_relations();

DROP TRIGGER IF EXISTS services_search_vector_update_trigger ON public.services;
CREATE TRIGGER services_search_vector_update_trigger
  BEFORE INSERT OR UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.services_search_vector_update();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.subscription_payments
-- ========================

DROP TRIGGER IF EXISTS trigger_log_subscription_payment_changes ON public.subscription_payments;
CREATE TRIGGER trigger_log_subscription_payment_changes
  AFTER INSERT OR UPDATE ON public.subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_subscription_payment_changes();

DROP TRIGGER IF EXISTS trigger_update_subscription_payments_updated_at ON public.subscription_payments;
CREATE TRIGGER trigger_update_subscription_payments_updated_at
  BEFORE UPDATE ON public.subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_payments_updated_at();

-- ========================
-- public.tax_configurations
-- ========================

DROP TRIGGER IF EXISTS update_tax_configurations_updated_at ON public.tax_configurations;
CREATE TRIGGER update_tax_configurations_updated_at
  BEFORE UPDATE ON public.tax_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.tax_liabilities
-- ========================

DROP TRIGGER IF EXISTS update_tax_liabilities_updated_at ON public.tax_liabilities;
CREATE TRIGGER update_tax_liabilities_updated_at
  BEFORE UPDATE ON public.tax_liabilities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.transactions
-- ========================

DROP TRIGGER IF EXISTS set_fiscal_period_trigger ON public.transactions;
CREATE TRIGGER set_fiscal_period_trigger
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_fiscal_period();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- public.user_notification_preferences
-- ========================

DROP TRIGGER IF EXISTS trigger_update_user_notification_preferences_updated_at ON public.user_notification_preferences;
CREATE TRIGGER trigger_update_user_notification_preferences_updated_at
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_notification_preferences_updated_at();

-- ========================
-- public.user_permissions
-- ========================

DROP TRIGGER IF EXISTS trigger_audit_user_permissions ON public.user_permissions;
CREATE TRIGGER trigger_audit_user_permissions
  AFTER INSERT OR DELETE OR UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_user_permissions_changes();

-- ========================
-- public.work_schedules
-- ========================

DROP TRIGGER IF EXISTS trg_update_work_schedules_updated_at ON public.work_schedules;
CREATE TRIGGER trg_update_work_schedules_updated_at
  BEFORE UPDATE ON public.work_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_work_schedules_updated_at();
