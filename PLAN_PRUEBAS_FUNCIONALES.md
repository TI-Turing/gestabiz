# Plan de Pruebas Funcionales - Gestabiz

> **Fecha**: 7 de marzo de 2026  
> **Objetivo**: Recorrer TODA la aplicación probando cada componente y flujo funcional  
> **Método**: Navegación manual vía Chrome MCP + documentación de hallazgos  
> **Regla**: NO se corrige nada, solo se documenta

---

## Estrategia de Pruebas por Dependencias

### Orden de ejecución (las pruebas respetan dependencias):

```
1. Landing Page (sin auth)
2. Registro de Usuario (crea usuario de pruebas)
3. Login / Auth
4. Creación de Negocio (Admin Onboarding)
5. Gestión de Sedes (requiere negocio)
6. Gestión de Servicios (requiere negocio + sede)
7. Gestión de Empleados (requiere negocio + sede)
8. Flujo de Citas - Admin (requiere negocio + sede + servicio + empleado)
9. Flujo de Citas - Client (requiere todo lo anterior)
10. Employee Dashboard (requiere empleado registrado)
11. Sistemas auxiliares (chat, reviews, billing, ausencias, etc.)
```

---

## Datos de prueba a crear

| Dato | Valor | Propósito |
|------|-------|-----------|
| Usuario Admin | test-admin-qa@gestabiz.com | Probar flujo admin completo |
| Usuario Employee | test-employee-qa@gestabiz.com | Probar flujo empleado |
| Usuario Client | test-client-qa@gestabiz.com | Probar flujo cliente |
| Negocio | "QA Peluquería Test" | Negocio principal de pruebas |
| Sede | "Sede Principal QA" | Sede del negocio |
| Servicio | "Corte de Cabello QA" | Servicio para citas |

---

## Inventario Completo de Componentes

### A. RUTAS PÚBLICAS (sin autenticación)

| # | Componente | Ruta | Estado |
|---|-----------|------|--------|
| A1 | LandingPage | `/` | ✅ Probado (H-001..H-009, H-025) |
| A2 | AuthScreen (Login) | `/login` | ✅ Probado (H-026) |
| A3 | AuthScreen (Register) | `/register` | ✅ Probado (H-011..H-016) |
| A4 | PublicBusinessProfile | `/negocio/:slug` | ⬜ Pendiente |
| A5 | AppointmentConfirmation | `/confirmar-cita/:token` | ⬜ No aplica (sin citas) |
| A6 | AppointmentCancellation | `/cancelar-cita/:token` | ⬜ No aplica (sin citas) |
| A7 | PricingPage | `/pricing` (landing) | ✅ Probado (sección pricing en landing) |

### B. ADMIN DASHBOARD - Componentes principales

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| B1 | AdminDashboard | admin/AdminDashboard.tsx | ✅ Probado (12 secciones sidebar) |
| B2 | AdminOnboarding | admin/AdminOnboarding.tsx | ⬜ N/A (owner ya tiene negocio) |
| B3 | BusinessSelector | admin/BusinessSelector.tsx | ✅ Probado (dropdown header) |
| B4 | OverviewTab | admin/OverviewTab.tsx | ✅ Probado (stats, badges) |
| B5 | BusinessManagement | admin/BusinessManagement.tsx | ✅ Probado |
| B6 | BusinessRegistration | business/BusinessRegistration.tsx | ✅ Probado (H-010 CRÍTICO) |
| B7 | BusinessSettings | admin/BusinessSettings.tsx | ✅ Probado (5 tabs, H-032 emoji) |

### C. ADMIN - Gestión de Sedes

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| C1 | LocationsManager | admin/LocationsManager.tsx | ✅ Probado (H-022, H-024) |
| C2 | LocationManagement | admin/LocationManagement.tsx | ✅ Probado (modal edit) |
| C3 | LocationProfileModal | admin/LocationProfileModal.tsx | ✅ Probado (3 tabs) |

### D. ADMIN - Gestión de Servicios

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| D1 | ServicesManager | admin/ServicesManager.tsx | ✅ Probado (3 servicios) |
| D2 | ServiceManagement | admin/ServiceManagement.tsx | ✅ Probado |
| D3 | ServiceProfileModal | admin/ServiceProfileModal.tsx | ⬜ No abierto explícitamente |

### E. ADMIN - Gestión de Empleados

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| E1 | EmployeeManagement | admin/EmployeeManagement.tsx | ✅ Probado (H-018, 0 empleados) |
| E2 | EmployeeManagementNew | admin/EmployeeManagementNew.tsx | ⬜ Pendiente |
| E3 | EmployeeCard | admin/EmployeeCard.tsx | ⬜ Pendiente |
| E4 | EmployeeListView | admin/EmployeeListView.tsx | ⬜ Pendiente |
| E5 | EmployeeProfileModal | admin/EmployeeProfileModal.tsx | ⬜ Pendiente |
| E6 | EmployeeRequestsList | admin/EmployeeRequestsList.tsx | ⬜ Pendiente |
| E7 | EmployeeOccupancyModal | admin/EmployeeOccupancyModal.tsx | ⬜ Pendiente |
| E8 | EmployeeRevenueModal | admin/EmployeeRevenueModal.tsx | ⬜ Pendiente |
| E9 | EmployeeAppointmentsModal | admin/EmployeeAppointmentsModal.tsx | ⬜ Pendiente |
| E10 | EmployeeManagementHierarchy | admin/EmployeeManagementHierarchy.tsx | ⬜ Pendiente |
| E11 | HierarchyNode | admin/HierarchyNode.tsx | ⬜ Pendiente |
| E12 | HierarchyLevelSelector | admin/HierarchyLevelSelector.tsx | ⬜ Pendiente |
| E13 | HierarchyMapView | admin/HierarchyMapView.tsx | ⬜ Pendiente |
| E14 | RoleAssignment | admin/RoleAssignment.tsx | ⬜ Pendiente |
| E15 | BusinessInvitationCard | admin/BusinessInvitationCard.tsx | ⬜ Pendiente |

### F. ADMIN - Citas y Calendario

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| F1 | AppointmentsCalendar | admin/AppointmentsCalendar.tsx | ✅ Probado (admin, H-017) |
| F2 | AppointmentWizard | appointments/AppointmentWizard.tsx | ✅ Probado Steps 1-4 (H-032, H-036 CRÍTICO, H-037, H-038) |
| F3 | BusinessSelection (wizard) | wizard-steps/BusinessSelection.tsx | ✅ Probado Step 1 |
| F4 | LocationSelection (wizard) | wizard-steps/LocationSelection.tsx | ✅ Probado (H-037 Step counter) |
| F5 | ServiceSelection (wizard) | wizard-steps/ServiceSelection.tsx | ✅ Probado (5 servicios cargados OK) |
| F6 | EmployeeSelection (wizard) | wizard-steps/EmployeeSelection.tsx | ✅ Probado (1 profesional, rating 5.0) |
| F7 | DateTimeSelection (wizard) | wizard-steps/DateTimeSelection.tsx | 🔴 BLOQUEADO (H-036: dialog se cierra al clicar fecha/hora) |
| F8 | ConfirmationStep (wizard) | wizard-steps/ConfirmationStep.tsx | ⛔ No accesible (bloqueado por H-036) |
| F9 | SuccessStep (wizard) | wizard-steps/SuccessStep.tsx | ⛔ No accesible (bloqueado por H-036) |
| F10 | ProgressBar (wizard) | wizard-steps/ProgressBar.tsx | ✅ Probado (H-037: Step 0 of 5 bug) |
| F11 | ResourceSelection | appointments/ResourceSelection.tsx | ⬜ Pendiente |
| F12 | FiltersPanel | admin/FiltersPanel.tsx | ✅ Probado (H-017) |

### G. ADMIN - Contabilidad y Reportes

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| G1 | AccountingPage | admin/AccountingPage.tsx | ⬜ Pendiente |
| G2 | ReportsPage | admin/ReportsPage.tsx | ✅ Probado (dashboard financiero) |
| G3 | ComprehensiveReports | admin/ComprehensiveReports.tsx | ⬜ Pendiente |
| G4 | AdminReports | admin/AdminReports.tsx | ⬜ Pendiente |
| G5 | TaxConfiguration | accounting/TaxConfiguration.tsx | ⬜ Pendiente |
| G6 | TransactionForm | transactions/TransactionForm.tsx | ⬜ Pendiente |
| G7 | TransactionList | transactions/TransactionList.tsx | ⬜ Pendiente |
| G8 | EnhancedTransactionForm | transactions/EnhancedTransactionForm.tsx | ⬜ Pendiente |
| G9 | EnhancedFinancialDashboard | transactions/EnhancedFinancialDashboard.tsx | ⬜ Pendiente |
| G10 | FinancialDashboard | transactions/FinancialDashboard.tsx | ⬜ Pendiente |
| G11 | CategoryPieChart | accounting/CategoryPieChart.tsx | ⬜ Pendiente |
| G12 | EmployeeRevenueChart | accounting/EmployeeRevenueChart.tsx | ⬜ Pendiente |
| G13 | IncomeVsExpenseChart | accounting/IncomeVsExpenseChart.tsx | ⬜ Pendiente |
| G14 | LocationBarChart | accounting/LocationBarChart.tsx | ⬜ Pendiente |
| G15 | MonthlyTrendChart | accounting/MonthlyTrendChart.tsx | ⬜ Pendiente |

### H. ADMIN - Reclutamiento / Vacantes

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| H1 | RecruitmentDashboard | jobs/RecruitmentDashboard.tsx | ✅ Probado (H-019 crash) |
| H2 | RecruitmentView | admin/RecruitmentView.tsx | ⬜ Pendiente |
| H3 | CreateVacancy | jobs/CreateVacancy.tsx | ✅ CRASH (H-019 CRÍTICO) |
| H4 | VacancyList | jobs/VacancyList.tsx | ⬜ Pendiente |
| H5 | VacancyCard | jobs/VacancyCard.tsx | ⬜ Pendiente |
| H6 | VacancyDetail | jobs/VacancyDetail.tsx | ⬜ Pendiente |
| H7 | ApplicationsManagement | jobs/ApplicationsManagement.tsx | ⬜ Pendiente |
| H8 | ApplicationList | jobs/ApplicationList.tsx | ⬜ Pendiente |
| H9 | ApplicationCard | jobs/ApplicationCard.tsx | ⬜ Pendiente |
| H10 | ApplicationDetail | jobs/ApplicationDetail.tsx | ⬜ Pendiente |
| H11 | ApplicationFormModal | jobs/ApplicationFormModal.tsx | ⬜ Pendiente |
| H12 | ApplicantProfileModal | jobs/ApplicantProfileModal.tsx | ⬜ Pendiente |
| H13 | SelectEmployeeModal | jobs/SelectEmployeeModal.tsx | ⬜ Pendiente |
| H14 | MandatoryReviewModal | jobs/MandatoryReviewModal.tsx | ⬜ Pendiente |
| H15 | ScheduleConflictAlert | jobs/ScheduleConflictAlert.tsx | ⬜ Pendiente |
| H16 | AvailableVacanciesMarketplace | jobs/AvailableVacanciesMarketplace.tsx | ⬜ Pendiente |
| H17 | MyApplicationsModal | jobs/MyApplicationsModal.tsx | ⬜ Pendiente |
| H18 | EmployeeProfileSettings | jobs/EmployeeProfileSettings.tsx | ⬜ Pendiente |

### I. ADMIN - Permisos

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| I1 | PermissionsManager | admin/PermissionsManager.tsx | ✅ Probado (solo tab Usuarios, H-028) |
| I2 | PermissionTemplates | admin/PermissionTemplates.tsx | ✅ Probado (placeholder, H-028) |
| I3 | PermissionEditor | admin/PermissionEditor.tsx | ✅ Probado (placeholder, H-028) |
| I4 | PermissionGate | ui/PermissionGate.tsx | ⬜ No verificable visualmente |

### J. ADMIN - Ausencias y Vacaciones

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| J1 | AbsencesTab | admin/AbsencesTab.tsx | ✅ Probado (estado vacío) |
| J2 | AbsenceApprovalCard | absences/AbsenceApprovalCard.tsx | ⬜ Pendiente |
| J3 | AbsenceRequestModal | absences/AbsenceRequestModal.tsx | ⬜ Pendiente |
| J4 | VacationDaysWidget | absences/VacationDaysWidget.tsx | ⬜ Pendiente |

### K. ADMIN - Ventas Rápidas y Gastos

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| K1 | QuickSaleForm | sales/QuickSaleForm.tsx | ✅ Probado (formulario completo) |
| K2 | QuickSalesPage | pages/QuickSalesPage.tsx | ✅ Probado (stats + historial) |
| K3 | Expenses (carpeta) | admin/expenses/ | ✅ Probado (3 tabs funcionales) |

### L. ADMIN - Clientes Recurrentes y Recursos

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| L1 | ClientManagement | admin/ClientManagement.tsx | ⬜ Pendiente |
| L2 | RecurringClientsManagement | admin/RecurringClientsManagement.tsx | ⬜ Pendiente |
| L3 | ResourcesManager | admin/ResourcesManager.tsx | ⬜ Pendiente |

### M. EMPLOYEE DASHBOARD

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| M1 | EmployeeDashboard | employee/EmployeeDashboard.tsx | ✅ Probado (H-030 nav rota) |
| M2 | EmployeeOnboarding | employee/EmployeeOnboarding.tsx | ⬜ Pendiente |
| M3 | EmployeeAppointmentsList | employee/EmployeeAppointmentsList.tsx | ⬜ Pendiente |
| M4 | EmployeeAppointmentModal | employee/EmployeeAppointmentModal.tsx | ⬜ Pendiente |
| M5 | EmployeeAppointmentsPage | employee/EmployeeAppointmentsPage.tsx | ⬜ Pendiente |
| M6 | EmployeeCalendarView | employee/EmployeeCalendarView.tsx | ⬜ Pendiente |
| M7 | EmployeeAbsencesTab | employee/EmployeeAbsencesTab.tsx | ⬜ Pendiente |
| M8 | EmployeeRequestAccess | employee/EmployeeRequestAccess.tsx | ⬜ Pendiente |
| M9 | EmployeeRequests | employee/EmployeeRequests.tsx | ⬜ Pendiente |
| M10 | MyEmployments | employee/MyEmployments.tsx | ✅ Probado (única vista que carga) |
| M11 | MyEmploymentsEnhanced | employee/MyEmploymentsEnhanced.tsx | ⬜ Pendiente |
| M12 | BusinessEmploymentCard | employee/BusinessEmploymentCard.tsx | ⬜ Pendiente |
| M13 | EmploymentDetailModal | employee/EmploymentDetailModal.tsx | ⬜ Pendiente |
| M14 | JoinBusiness | employee/JoinBusiness.tsx | ⬜ Pendiente |
| M15 | LocationSelector | employee/LocationSelector.tsx | ⬜ Pendiente |
| M16 | ServiceSelector | employee/ServiceSelector.tsx | ⬜ Pendiente |
| M17 | WorkScheduleEditor | employee/WorkScheduleEditor.tsx | ⬜ Pendiente |
| M18 | LocationTransferModal | employee/LocationTransferModal.tsx | ⬜ Pendiente |
| M19 | TransferStatusBadge | employee/TransferStatusBadge.tsx | ⬜ Pendiente |
| M20 | ConfirmEndEmploymentDialog | employee/ConfirmEndEmploymentDialog.tsx | ⬜ Pendiente |
| M21 | PhoneRequiredModal | employee/PhoneRequiredModal.tsx | ✅ Probado (H-030 prerequisito) |
| M22 | TimeOffRequestModal | employee/TimeOffRequestModal.tsx | ⬜ Pendiente |

### N. CLIENT DASHBOARD

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| N1 | ClientDashboard | client/ClientDashboard.tsx | ✅ Probado (3 secciones sidebar) |
| N2 | SearchBar | client/SearchBar.tsx | ⬜ Pendiente |
| N3 | SimpleSearchBar | client/SimpleSearchBar.tsx | ⬜ Pendiente |
| N4 | SearchResults | client/SearchResults.tsx | ⬜ Pendiente |
| N5 | ClientHistory | client/ClientHistory.tsx | ✅ Probado (stats + filtros) |
| N6 | ClientCalendarView | client/ClientCalendarView.tsx | ✅ Probado (3 vistas: Día/Semana/Mes OK) |
| N7 | FavoritesList | client/FavoritesList.tsx | ✅ Probado (estado vacío) |
| N8 | BusinessSuggestions | client/BusinessSuggestions.tsx | ⬜ Pendiente |
| N9 | CitySelector | client/CitySelector.tsx | ⬜ Pendiente |
| N10 | BusinessProfile (modal) | business/BusinessProfile.tsx | ⬜ Pendiente |

### O. CHAT

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| O1 | ChatLayout | chat/ChatLayout.tsx | ✅ Probado (estado vacío) |
| O2 | SimpleChatLayout | chat/SimpleChatLayout.tsx | ⬜ Pendiente |
| O3 | ChatWindow | chat/ChatWindow.tsx | ⬜ Pendiente |
| O4 | ChatInput | chat/ChatInput.tsx | ⬜ Pendiente |
| O5 | ConversationList | chat/ConversationList.tsx | ⬜ Pendiente |
| O6 | MessageBubble | chat/MessageBubble.tsx | ⬜ Pendiente |
| O7 | FloatingChatButton | chat/FloatingChatButton.tsx | ✅ Probado |
| O8 | ChatWithAdminModal | business/ChatWithAdminModal.tsx | ⬜ Pendiente |
| O9 | FileUpload | chat/FileUpload.tsx | ⬜ Pendiente |
| O10 | TypingIndicator | chat/TypingIndicator.tsx | ⬜ Pendiente |

### P. BILLING / PAGOS

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| P1 | BillingDashboard | billing/BillingDashboard.tsx | ✅ Probado (H-020, H-027) |
| P2 | PaymentHistory | billing/PaymentHistory.tsx | ⬜ Pendiente |
| P3 | UsageMetrics | billing/UsageMetrics.tsx | ⬜ Pendiente |
| P4 | PlanUpgradeModal | billing/PlanUpgradeModal.tsx | ⬜ Pendiente |
| P5 | AddPaymentMethodModal | billing/AddPaymentMethodModal.tsx | ⬜ Pendiente |
| P6 | CancelSubscriptionModal | billing/CancelSubscriptionModal.tsx | ⬜ Pendiente |
| P7 | PricingPlans | landing/PricingPlans.tsx | ✅ Probado (4 planes, H-027) |

### Q. REVIEWS

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| Q1 | ReviewCard | reviews/ReviewCard.tsx | ⬜ Pendiente |
| Q2 | ReviewForm | reviews/ReviewForm.tsx | ⬜ Pendiente |
| Q3 | ReviewList | reviews/ReviewList.tsx | ⬜ Pendiente |

### R. NOTIFICACIONES

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| R1 | NotificationBell | notifications/NotificationBell.tsx | ✅ Probado |
| R2 | NotificationCenter | notifications/NotificationCenter.tsx | ✅ Probado (3 tabs) |
| R3 | NotificationSettings | settings/NotificationSettings.tsx | ⬜ Pendiente |

### S. CONFIGURACIONES

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| S1 | CompleteUnifiedSettings | settings/CompleteUnifiedSettings.tsx | ✅ Probado (5 tabs, H-033) |
| S2 | UnifiedSettings | settings/UnifiedSettings.tsx | ⬜ Pendiente |
| S3 | ProfilePage | settings/ProfilePage.tsx | ⬜ Pendiente |
| S4 | UserProfile | settings/UserProfile.tsx | ⬜ Pendiente |
| S5 | UserSettings | settings/UserSettings.tsx | ⬜ Pendiente |
| S6 | BannerCropper | settings/BannerCropper.tsx | ⬜ Pendiente |
| S7 | ImageCropper | settings/ImageCropper.tsx | ⬜ Pendiente |

### T. LAYOUT Y UI COMPARTIDA

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| T1 | UnifiedLayout | layouts/UnifiedLayout.tsx | ✅ Probado (3 roles) |
| T2 | LayoutHeader | layout/LayoutHeader.tsx | ⬜ Pendiente |
| T3 | ErrorBoundary | ErrorBoundary.tsx | ✅ Probado (activado por H-019) |
| T4 | CookieConsent | CookieConsent.tsx | ⬜ Pendiente |
| T5 | RoleSelector | ui/RoleSelector.tsx | ✅ Probado (Admin→Empleado→Cliente) |
| T6 | LanguageToggle | ui/language-toggle.tsx | ⬜ Pendiente |
| T7 | ThemeToggle | ui/theme-toggle.tsx | ⬜ Pendiente |
| T8 | QRScanner | QRScanner.tsx | ⬜ Pendiente |

### U. BUG REPORTS

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| U1 | BugReportModal | bug-report/BugReportModal.tsx | ✅ Probado (formulario completo) |
| U2 | FloatingBugReportButton | bug-report/FloatingBugReportButton.tsx | ✅ Probado |

### V. GOOGLE CALENDAR

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| V1 | GoogleCalendarIntegration | calendar/GoogleCalendarIntegration.tsx | ⬜ Pendiente |

### W. DASHBOARD GENÉRICOS

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| W1 | Dashboard | dashboard/Dashboard.tsx | ⬜ Pendiente |
| W2 | DashboardOverview | dashboard/DashboardOverview.tsx | ⬜ Pendiente |
| W3 | AppointmentsView | dashboard/AppointmentsView.tsx | ⬜ Pendiente |
| W4 | ClientsView | dashboard/ClientsView.tsx | ⬜ Pendiente |
| W5 | AdvancedFilters | dashboard/AdvancedFilters.tsx | ⬜ Pendiente |
| W6 | AppointmentForm | dashboard/AppointmentForm.tsx | ⬜ Pendiente |
| W7 | ServiceForm | dashboard/ServiceForm.tsx | ⬜ Pendiente |
| W8 | RecommendedBusinesses | dashboard/RecommendedBusinesses.tsx | ⬜ Pendiente |
| W9 | NotificationSettings (dash) | dashboard/NotificationSettings.tsx | ⬜ Pendiente |

### X. AUDIT LOG

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| X1 | AuditLog | admin/AuditLog.tsx | ⬜ Pendiente |

### Y. TEST DATA

| # | Componente | Ubicación | Estado |
|---|-----------|-----------|--------|
| Y1 | TestDataSeeder | admin/TestDataSeeder.tsx | ⬜ Pendiente |
| Y2 | AdminTestDataPage | pages/AdminTestDataPage.tsx | ⬜ Pendiente |
| Y3 | CreateTestUsers | admin/CreateTestUsers.tsx | ⬜ Pendiente |

---

## Flujos E2E a probar

### Flujo 1: Registro → Admin → Crear Negocio
1. Abrir landing page
2. Clic en "Registrarse"
3. Completar formulario de registro
4. Verificar redirect a /app
5. Verificar que muestra onboarding de admin
6. Crear negocio con datos de prueba
7. Verificar que aparece el AdminDashboard

### Flujo 2: Admin configura negocio completo
1. Crear sede (nombre, dirección, horarios)
2. Crear servicio (nombre, duración, precio)
3. Invitar/agregar empleado
4. Asignar servicio a empleado
5. Verificar que todo aparece configurado

### Flujo 3: Cliente crea cita
1. Login como cliente
2. Buscar negocio
3. Abrir wizard de cita
4. Seleccionar negocio → sede → servicio → empleado → fecha/hora
5. Confirmar cita
6. Verificar en dashboard del cliente

### Flujo 4: Empleado gestiona citas
1. Login como empleado
2. Ver citas asignadas
3. Probar calendario del empleado
4. Probar solicitud de ausencia

### Flujo 5: Admin gestiona todo
1. Ver dashboard overview con stats
2. Navegar por cada sección del menú lateral
3. Probar contabilidad, reportes, gastos
4. Probar reclutamiento/vacantes
5. Probar permisos
6. Probar configuraciones

---

## Progreso de ejecución

| Fase | Estado | Fecha |
|------|--------|-------|
| Fase 0: Setup | ✅ Completado | 7 Mar 2026 |
| Fase 1: Landing + Auth | ✅ Completado | 7 Mar 2026 |
| Fase 2: Admin Onboarding | ✅ Completado (H-010 bloquea creación negocio) | 7 Mar 2026 |
| Fase 3: Config Negocio (Admin completo) | ✅ Completado (12 secciones, 19 hallazgos) | 7 Mar 2026 |
| Fase 4: Flujo Citas (wizard paso 1) | ✅ Parcial (solo Step 1 de 6) | 7 Mar 2026 |
| Fase 5: Employee | ✅ Completado (nav rota H-030) | 7 Mar 2026 |
| Fase 6: Client | ✅ Completado (3 secciones + wizard Step 1) | 7 Mar 2026 |
| Fase 7: Sistemas aux. | ✅ Completado (chat, notif, bug report, billing, settings) | 7 Mar 2026 |
