// Central barrel export for all test utilities
export {
  createTestQueryClient,
  createWrapper,
  renderWithProviders,
  renderHookWithProviders,
  renderWithAuth,
} from './render-with-providers'

export {
  createMockUser,
  createMockBusiness,
  createMockService,
  createMockLocation,
  createMockAppointment,
  createMockEmployee,
  createMockReview,
  createMockNotification,
  createMockConversation,
  createMockMessage,
  createMockServices,
  createMockAppointments,
  createMockNotifications,
  // Admin role factories
  createMockResource,
  createMockTransaction,
  createMockRecurringExpense,
  createMockVacancy,
  createMockApplication,
  createMockUserPermission,
  createMockTransactions,
  createMockResources,
  createMockVacancies,
  createMockApplications,
} from './mock-factories'

export {
  createMockSupabaseClient,
  mockSupabaseSuccess,
  mockSupabaseError,
  mockAuthUser,
  mockAuthSession,
  mockSupabaseChain,
  mockSupabaseRpc,
  mockRealtimeChannel,
  mockSupabaseFrom,
} from './supabase-mock'

export {
  mockUsePermissions,
  mockPermissionsAsOwner,
  mockPermissionsAsClient,
  mockPermissionsLoading,
} from './mock-permissions'
