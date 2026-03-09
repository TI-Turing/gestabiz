// Auto-generated index for Spanish translations
import { common } from './common'
import { auth, emailVerification, accountInactive } from './auth'
import { appointments } from './appointments'
import { dashboard } from './dashboard'
import { calendar } from './calendar'
import { settings } from './settings'
import { nav, ui, validation, profile as navigationProfile } from './navigation'
import { profile as profileTranslations } from './profile'
import { business, clients, services, locations, employees } from './business'
import { notifications } from './notifications'
import { reviews } from './reviews'
import { jobs } from './jobs'
// absences: NOT exported from modular system — old monolithic translations are used
// The modular absences.ts has incompatible nested structure vs flat keys expected by components
// import { absences } from './absences'
import { businessResources, permissions, comprehensiveReports, clientManagement, reports, admin, search, taxConfiguration, userProfile } from './admin'
import { landing, employee } from './landing'
import { financial } from './financial'
import { transactions } from './transactions'

// Dashboard modules
import { adminDashboard } from './adminDashboard'
import { employeeDashboard } from './employeeDashboard'
import { clientDashboard } from './clientDashboard'

// UI Component modules
import { imageCropper } from './imageCropper'
import { bannerCropper } from './bannerCropper'
import { favoritesList } from './favoritesList'
import { citySelector } from './citySelector'
import { businessSelector } from './businessSelector'
import { themeToggle } from './themeToggle'
import { roleSelector } from './roleSelector'
import { serviceStatusBadge } from './serviceStatusBadge'
import { languageToggle } from './languageToggle'
import { ownerBadge } from './ownerBadge'

// Business feature modules
import { businessInvitationCard } from './businessInvitationCard'
import { quickSaleForm } from './quickSaleForm'
import { businessSuggestions } from './businessSuggestions'
import { recommendedBusinesses } from './recommendedBusinesses'
import { dashboardOverview } from './dashboardOverview'

// Review system modules
import { reviewForm } from './reviewForm'
import { reviewCard } from './reviewCard'
import { reviewList } from './reviewList'

// Employee profile modals module
import { employeeProfile } from './employeeProfile'

// Other modules
import { profilePage } from './profilePage'
import { cookieConsent } from './cookieConsent'

export const es = {
  common,
  auth,
  emailVerification,
  accountInactive,
  appointments,
  dashboard,
  calendar,
  settings,
  // Navigation group
  nav,
  ui,
  validation,
  profile: {
    ...navigationProfile,
    ...profileTranslations
  },
  // Business entities
  business,
  clients,
  services,
  locations,
  employees,
  // Secondary features
  notifications,
  reviews,
  jobs,
  // absences — uses old monolithic translations (flat keys)
  // Financial & Transactions
  financial,
  transactions,
  // Admin & System
  businessResources,
  permissions,
  comprehensiveReports,
  clientManagement,
  reports,
  admin,
  search,
  taxConfiguration,
  userProfile,
  // UI Components
  adminDashboard,
  employeeDashboard,
  clientDashboard,
  imageCropper,
  bannerCropper,
  quickSaleForm,
  reviewForm,
  reviewCard,
  reviewList,
  favoritesList,
  citySelector,
  businessSelector,
  themeToggle,
  roleSelector,
  serviceStatusBadge,
  languageToggle,
  ownerBadge,
  businessInvitationCard,
  profilePage,
  recommendedBusinesses,
  businessSuggestions,
  dashboardOverview,
  cookieConsent,
  // Landing & Employee
  landing,
  employee,
  // Employee profile modals
  employeeProfile,
}

