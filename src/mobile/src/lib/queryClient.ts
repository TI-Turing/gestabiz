import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 min por defecto
    },
  },
})

export const QUERY_CONFIG = {
  STABLE: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  },
  FREQUENT: {
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
  },
  REALTIME: {
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchInterval: 30000,
  },
}

export const QUERY_KEYS = {
  APPOINTMENTS: (businessId: string) => ['appointments', businessId],
  MY_APPOINTMENTS: (userId: string) => ['my-appointments', userId],
  SERVICES: (businessId: string) => ['services', businessId],
  EMPLOYEES: (businessId: string) => ['employees', businessId],
  LOCATIONS: (businessId: string) => ['locations', businessId],
  CLIENTS: (businessId: string) => ['clients', businessId],
  ABSENCES: (businessId: string) => ['absences', businessId],
  TRANSACTIONS: (businessId: string) => ['transactions', businessId],
  BUSINESS: (businessId: string) => ['business', businessId],
  PROFILE: (userId: string) => ['profile', userId],
  NOTIFICATIONS: (userId: string) => ['notifications', userId],
  USER_ROLES: (userId: string) => ['user-roles', userId],
  ADMIN_BUSINESSES: (userId: string) => ['admin-businesses', userId],
  EMPLOYEE_BUSINESSES: (userId: string) => ['employee-businesses', userId],
  BUSINESS_SEARCH: (query: string) => ['business-search', query],
  BUSINESS_PROFILE: (slug: string) => ['business-profile', slug],
  AVAILABLE_SLOTS: (employeeId: string, date: string) => ['available-slots', employeeId, date],
}
