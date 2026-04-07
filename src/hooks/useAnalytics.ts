/**
 * Hook personalizado para Google Analytics 4
 * 
 * Proporciona funciones type-safe para tracking de eventos críticos:
 * - Pageviews
 * - Booking flow (started, step_completed, completed, abandoned)
 * - User interactions (login, signup, search, reviews)
 * - Business profile views
 * - Conversions y errores
 * 
 * @example
 * const analytics = useAnalytics();
 * analytics.trackPageView('/negocio/salon-belleza-medellin');
 * analytics.trackBookingStarted('business-123', 'service-456');
 */

import { useCallback, useEffect } from 'react';
import ReactGA from 'react-ga4';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface BookingEventParams {
  businessId: string;
  businessName?: string;
  serviceId?: string;
  serviceName?: string;
  employeeId?: string;
  employeeName?: string;
  locationId?: string;
  locationName?: string;
  stepNumber?: number;
  totalSteps?: number;
  amount?: number;
  currency?: string;
  duration?: number; // en minutos
}

export interface ProfileViewParams {
  businessId: string;
  businessName?: string;
  slug: string;
  category?: string;
  hasReviews?: boolean;
  averageRating?: number;
}

export interface SearchParams {
  query: string;
  filters?: {
    category?: string;
    city?: string;
    minRating?: number;
  };
  resultsCount?: number;
}

export interface ErrorParams {
  errorMessage: string;
  errorCode?: string;
  page?: string;
  userId?: string;
}

// ============================================
// HOOK
// ============================================

export function useAnalytics() {
  // Verificar si GA está habilitado
  const isEnabled = useCallback(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    const isDev = import.meta.env.DEV;
    const userConsent = localStorage.getItem('ga_consent') === 'true';
    
    return Boolean(gaId) && !isDev && userConsent;
  }, []);

  // ============================================
  // PAGEVIEW TRACKING
  // ============================================

  const trackPageView = useCallback((path: string, title?: string) => {
    if (!isEnabled()) return;

    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    });  }, [isEnabled]);

  // ============================================
  // BOOKING FLOW EVENTS
  // ============================================

  const trackBookingStarted = useCallback((params: BookingEventParams) => {
    if (!isEnabled()) return;

    ReactGA.event('booking_started', {
      business_id: params.businessId,
      business_name: params.businessName,
      service_id: params.serviceId,
      service_name: params.serviceName,
      currency: params.currency || 'COP',
    });  }, [isEnabled]);

  const trackBookingStepCompleted = useCallback((params: BookingEventParams) => {
    if (!isEnabled()) return;

    ReactGA.event('booking_step_completed', {
      business_id: params.businessId,
      step_number: params.stepNumber,
      total_steps: params.totalSteps,
      service_id: params.serviceId,
      employee_id: params.employeeId,
      location_id: params.locationId,
    });  }, [isEnabled]);

  const trackBookingCompleted = useCallback((params: BookingEventParams) => {
    if (!isEnabled()) return;

    // Evento estándar de GA4 para conversiones
    ReactGA.event('purchase', {
      transaction_id: `booking_${Date.now()}`,
      value: params.amount || 0,
      currency: params.currency || 'COP',
      items: [
        {
          item_id: params.serviceId,
          item_name: params.serviceName,
          item_category: 'Service',
          price: params.amount,
          quantity: 1,
        },
      ],
    });

    // Evento personalizado adicional
    ReactGA.event('booking_completed', {
      business_id: params.businessId,
      business_name: params.businessName,
      service_id: params.serviceId,
      service_name: params.serviceName,
      employee_id: params.employeeId,
      employee_name: params.employeeName,
      location_id: params.locationId,
      amount: params.amount,
      currency: params.currency || 'COP',
      duration_minutes: params.duration,
    });  }, [isEnabled]);

  const trackBookingAbandoned = useCallback((params: BookingEventParams) => {
    if (!isEnabled()) return;

    ReactGA.event('booking_abandoned', {
      business_id: params.businessId,
      step_number: params.stepNumber,
      total_steps: params.totalSteps,
      service_id: params.serviceId,
      employee_id: params.employeeId,
    });  }, [isEnabled]);

  // ============================================
  // PROFILE & BUSINESS EVENTS
  // ============================================

  const trackProfileView = useCallback((params: ProfileViewParams) => {
    if (!isEnabled()) return;

    ReactGA.event('profile_view', {
      business_id: params.businessId,
      business_name: params.businessName,
      slug: params.slug,
      category: params.category,
      has_reviews: params.hasReviews,
      average_rating: params.averageRating,
    });  }, [isEnabled]);

  const trackReserveButtonClick = useCallback((params: {
    businessId: string;
    serviceId?: string;
    source: 'profile' | 'search' | 'landing';
  }) => {
    if (!isEnabled()) return;

    ReactGA.event('click_reserve_button', {
      business_id: params.businessId,
      service_id: params.serviceId,
      source: params.source,
    });  }, [isEnabled]);

  const trackContactClick = useCallback((params: {
    businessId: string;
    contactType: 'phone' | 'email' | 'whatsapp' | 'maps';
  }) => {
    if (!isEnabled()) return;

    ReactGA.event('click_contact', {
      business_id: params.businessId,
      contact_type: params.contactType,
    });  }, [isEnabled]);

  // ============================================
  // USER ACTIONS
  // ============================================

  const trackLogin = useCallback((method: 'email' | 'google' | 'github') => {
    if (!isEnabled()) return;

    ReactGA.event('login', {
      method,
    });  }, [isEnabled]);

  const trackSignup = useCallback((method: 'email' | 'google' | 'github') => {
    if (!isEnabled()) return;

    ReactGA.event('sign_up', {
      method,
    });  }, [isEnabled]);

  const trackSearch = useCallback((params: SearchParams) => {
    if (!isEnabled()) return;

    ReactGA.event('search', {
      search_term: params.query,
      category: params.filters?.category,
      city: params.filters?.city,
      min_rating: params.filters?.minRating,
      results_count: params.resultsCount,
    });  }, [isEnabled]);

  const trackReviewSubmitted = useCallback((params: {
    businessId: string;
    rating: number;
    hasComment: boolean;
  }) => {
    if (!isEnabled()) return;

    ReactGA.event('review_submitted', {
      business_id: params.businessId,
      rating: params.rating,
      has_comment: params.hasComment,
    });  }, [isEnabled]);

  // ============================================
  // ERROR TRACKING
  // ============================================

  const trackError = useCallback((params: ErrorParams) => {
    if (!isEnabled()) return;

    ReactGA.event('exception', {
      description: params.errorMessage,
      error_code: params.errorCode,
      page: params.page || window.location.pathname,
      fatal: false,
    });  }, [isEnabled]);

  // ============================================
  // USER PROPERTIES
  // ============================================

  const setUserProperties = useCallback((properties: {
    userId?: string;
    role?: 'admin' | 'employee' | 'client';
    businessId?: string;
    planType?: string;
  }) => {
    if (!isEnabled()) return;

    ReactGA.set({
      user_id: properties.userId,
      user_role: properties.role,
      business_id: properties.businessId,
      plan_type: properties.planType,
    });  }, [isEnabled]);

  // ============================================
  // LIFECYCLE
  // ============================================

  useEffect(() => {
    // Auto-track pageview en cada cambio de ruta
    trackPageView(window.location.pathname);
  }, [trackPageView]);

  return {
    // Core
    isEnabled,
    trackPageView,
    setUserProperties,
    
    // Booking flow
    trackBookingStarted,
    trackBookingStepCompleted,
    trackBookingCompleted,
    trackBookingAbandoned,
    
    // Profile & Business
    trackProfileView,
    trackReserveButtonClick,
    trackContactClick,
    
    // User actions
    trackLogin,
    trackSignup,
    trackSearch,
    trackReviewSubmitted,
    
    // Errors
    trackError,
  };
}

// ============================================
// CONSENT UTILITIES
// ============================================

export const grantAnalyticsConsent = () => {
  localStorage.setItem('ga_consent', 'true');};

export const revokeAnalyticsConsent = () => {
  localStorage.setItem('ga_consent', 'false');};

export const hasAnalyticsConsent = (): boolean => {
  return localStorage.getItem('ga_consent') === 'true';
};
