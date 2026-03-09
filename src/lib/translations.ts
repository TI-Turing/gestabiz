/**
 * ⚠️ DEPRECATED - LEGACY MONOLITHIC TRANSLATION FILE
 * 
 * This file is deprecated as of November 2025.
 * Please use the new modular i18n system instead.
 * 
 * NEW SYSTEM LOCATION: src/locales/
 * 
 * MIGRATION GUIDE:
 * ================
 * 
 * Old way (deprecated):
 * ```tsx
 * // This still works due to merge strategy, but is discouraged
 * import { translations } from '@/lib/translations'
 * ```
 * 
 * New way (recommended):
 * ```tsx
 * // Use LanguageContext instead
 * import { useLanguage } from '@/contexts/LanguageContext'
 * 
 * function MyComponent() {
 *   const { t } = useLanguage()
 *   return <h1>{t('common.actions.save')}</h1>
 * }
 * ```
 * 
 * WHY MIGRATE?
 * ============
 * ✅ Modular organization (16 files vs 1 monolithic file)
 * ✅ Type-safe with auto-completion
 * ✅ Easier to maintain and find translations
 * ✅ Better performance (lazy loading)
 * ✅ Scalable architecture
 * 
 * BACKWARD COMPATIBILITY:
 * =======================
 * This file is still imported by LanguageContext.tsx for backward compatibility.
 * The merge strategy ensures zero breaking changes:
 * - Old translations + New translations = Merged
 * - New translations take precedence when keys overlap
 * 
 * DEPRECATION TIMELINE:
 * =====================
 * - Nov 2025: Marked as deprecated, new system active
 * - Dec 2025: Update all components to use new system
 * - Jan 2026: Remove this file (tentative)
 * 
 * SEE: src/locales/README.md for complete documentation
 * 
 * ---
 * 
 * ORIGINAL FILE PRESERVED BELOW FOR BACKWARD COMPATIBILITY
 * DO NOT EDIT - All new translations should go to src/locales/
 */

export const translations = {
  en: {
    // Common - Common translations used across multiple components
    common: {
      // Actions
      actions: {
        save: 'Save',
        saving: 'Saving...',
        cancel: 'Cancel',
        delete: 'Delete',
        deleting: 'Deleting...',
        create: 'Create',
        creating: 'Creating...',
        update: 'Update',
        updating: 'Updating...',
        confirm: 'Confirm',
        edit: 'Edit',
        view: 'View',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        submit: 'Submit',
        search: 'Search',
        filter: 'Filter',
        reset: 'Reset',
        apply: 'Apply',
        download: 'Download',
        upload: 'Upload',
        select: 'Select',
        deselect: 'Deselect',
        selectAll: 'Select all',
        deselectAll: 'Deselect all',
        continue: 'Continue',
        finish: 'Finish',
        add: 'Add',
        remove: 'Remove',
        send: 'Send',
        receive: 'Receive',
        accept: 'Accept',
        reject: 'Reject',
        approve: 'Approve',
        decline: 'Decline',
        enable: 'Enable',
        disable: 'Disable',
        activate: 'Activate',
        deactivate: 'Deactivate',
        refresh: 'Refresh',
        reload: 'Reload',
        retry: 'Retry',
        copy: 'Copy',
        paste: 'Paste',
        duplicate: 'Duplicate',
        share: 'Share',
        export: 'Export',
        import: 'Import',
        print: 'Print',
      },
      // States
      states: {
        loading: 'Loading...',
        saved: 'Saved',
        deleted: 'Deleted',
        created: 'Created',
        updated: 'Updated',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Information',
        pending: 'Pending',
        processing: 'Processing...',
        completed: 'Completed',
        failed: 'Failed',
        active: 'Active',
        inactive: 'Inactive',
        enabled: 'Enabled',
        disabled: 'Disabled',
      },
      // Messages
      messages: {
        confirmDelete: 'Are you sure you want to delete this?',
        confirmCancel: 'Are you sure you want to cancel?',
        unsavedChanges: 'You have unsaved changes. Do you want to continue?',
        saveSuccess: 'Saved successfully',
        saveError: 'Error saving',
        deleteSuccess: 'Deleted successfully',
        deleteError: 'Error deleting',
        createSuccess: 'Created successfully',
        createError: 'Error creating',
        updateSuccess: 'Updated successfully',
        updateError: 'Error updating',
        loadError: 'Error loading data',
        requiredFields: 'Please fill in all required fields',
        invalidEmail: 'Please enter a valid email',
        invalidPhone: 'Please enter a valid phone number',
        passwordMismatch: 'Passwords do not match',
        noResults: 'No results found',
        noData: 'No data available',
        tryAgain: 'Please try again',
        sessionExpired: 'Your session has expired. Please log in again',
        unauthorized: 'You do not have permission to perform this action',
        notFound: 'Not found',
        serverError: 'Server error. Please try again later',
        networkError: 'Connection error. Check your internet',
      },
      // Forms
      forms: {
        required: 'Required',
        optional: 'Optional',
        pleaseSelect: 'Please select',
        selectOption: 'Select an option',
        enterValue: 'Enter a value',
        chooseFile: 'Choose file',
        noFileSelected: 'No file selected',
        dragDropFiles: 'Drag files here or click to select',
      },
      // Placeholders
      placeholders: {
        businessName: 'Your business name',
        businessDescription: 'Describe your business',
        phoneNumber: 'Phone number',
        email: 'contact@business.com',
        website: 'https://www.yourbusiness.com',
        address: 'Street and number',
        city: 'City',
        state: 'State',
        legalName: 'Legal name or business name',
        taxId: 'Tax identification number',
        selectLocation: 'Select a location',
        selectService: 'Select a service',
        selectEmployee: 'Select an employee',
        selectCity: 'Select a city',
        selectActivityType: 'Select activity type',
        selectDate: 'Select a date',
        selectType: 'Select a type',
        jobTitle: 'E.g: Professional Stylist',
        jobDescription: 'Describe the position and main functions',
        jobRequirements: 'List the requirements for this position',
        jobResponsibilities: 'Describe the responsibilities of the position',
        jobBenefits: 'Describe the benefits you offer',
        clientName: 'E.g: John Doe',
        clientPhone: 'E.g: 3001234567',
        clientDocument: 'E.g: 1234567890',
        clientEmail: 'E.g: client@example.com',
        amount: 'E.g: 50000',
        selectPaymentMethod: 'Select method',
        notes: 'E.g: Frequent client, discount applied...',
        transactionDetails: 'Additional transaction details...',
        applicationLetter: 'Tell us why you are the ideal candidate for this position...',
        availabilityNotes: 'Provide additional details about your request...',
        portfolio: 'https://your-portfolio.com',
        linkedin: 'https://linkedin.com/in/your-profile',
        github: 'https://github.com/your-username',
        bio: 'Describe your experience, skills and what makes you unique as a professional...',
        skills: 'E.g: Web Development, Digital Marketing...',
        languages: 'E.g: Spanish, English...',
        certificationName: 'Certification name *',
        certificationIssuer: 'Issuer *',
        certificationIssueDate: 'Issue date *',
        certificationExpiryDate: 'Expiry date',
        certificationId: 'Credential ID',
        certificationUrl: 'Credential URL',
        searchCountry: 'Search country...',
        searchCity: 'Search city...',
        searchEPS: 'Search EPS...',
        searchPrefix: 'Search prefix...',
        deactivateAccount: 'DEACTIVATE ACCOUNT',
        rejectionReason: 'Reason for decision...',
        internalNotes: 'Internal notes...',
        allLocations: 'All locations',
        allEmployees: 'All employees',
        allCategories: 'All categories',
        selectDepartmentFirst: 'First select a department',
        sortBy: 'Sort by',
        priceRange: 'Price range',
        status: 'Status',
        titleOrDescription: 'Title or description',
        expiryDate: 'Expiry date',
        credentialId: 'Credential ID',
        credentialUrl: 'Credential URL',
        selectDepartment: 'Select a department',
        all: 'All',
        allStatuses: 'All statuses',
        allVacancies: 'All vacancies',
        selectCategory: 'Select a category',
        selectBusiness: 'Select a business',
        period: 'Period',
      },
      // Validation messages
      validation: {
        selectRequestType: 'Select a request type',
        selectStartDate: 'Select start date',
        selectEndDate: 'Select end date',
        requestTooLong: 'Request cannot exceed 365 days',
        selectType: 'Select a type',
        selectDate: 'Select a date',
      },
      // Service Status
      serviceStatus: {
        connectionStatus: 'Connection Status',
        platform: 'Platform',
        authentication: 'Authentication',
        database: 'Database',
        storage: 'Storage',
        verifyAgain: 'Verify again',
        lastCheck: 'Last check',
        connectionError: 'We could not connect to the platform. Please try again in a few minutes.',
        persistentIssue: 'If the problem persists, contact us',
      },
      // Time & Date
      time: {
        today: 'Today',
        yesterday: 'Yesterday',
        tomorrow: 'Tomorrow',
        thisWeek: 'This week',
        lastWeek: 'Last week',
        nextWeek: 'Next week',
        thisMonth: 'This month',
        lastMonth: 'Last month',
        nextMonth: 'Next month',
        am: 'AM',
        pm: 'PM',
        hour: 'hour',
        hours: 'hours',
        minute: 'minute',
        minutes: 'minutes',
        day: 'day',
        days: 'days',
        week: 'week',
        weeks: 'weeks',
        month: 'month',
        months: 'months',
        year: 'year',
        years: 'years',
        // Days of the week
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday',
      },
      // Misc
      misc: {
        yes: 'Yes',
        no: 'No',
        ok: 'OK',
        all: 'All',
        none: 'None',
        other: 'Other',
        more: 'More',
        less: 'Less',
        show: 'Show',
        hide: 'Hide',
        expand: 'Expand',
        collapse: 'Collapse',
        total: 'Total',
        subtotal: 'Subtotal',
        of: 'of',
        page: 'Page',
        perPage: 'per page',
        results: 'results',
        showing: 'Showing',
        to: 'to',
        from: 'from',
        until: 'until',
      },
    },
    // Landing Page
    landing: {
      nav: {
        features: 'Features',
        benefits: 'Benefits',
        pricing: 'Pricing',
        testimonials: 'Testimonials',
        signIn: 'Sign In',
        getStarted: 'Get Started Free'
      },
      hero: {
        badge: 'Designed for Colombian SMBs',
        title: 'Manage your business on',
        titleHighlight: 'autopilot',
        subtitle: 'The ALL-IN-ONE platform to manage appointments, clients, employees, accounting, and more. Save time, increase revenue, and grow without limits.',
        cta: {
          trial: '30-Day FREE Trial',
          pricing: 'View Plans & Pricing',
          noCreditCard: 'No credit card required',
          cancelAnytime: 'Cancel anytime'
        },
        stats: {
          businesses: 'Active Businesses',
          appointments: 'Appointments Scheduled',
          satisfaction: 'Satisfaction'
        }
      },
      dashboard: {
        title: 'Dashboard',
        today: 'Today',
        appointments: 'Appointments Today',
        revenue: 'Monthly Revenue',
        upcoming: 'Upcoming Appointments',
        client: 'Client',
        haircut: 'Haircut',
        confirmed: 'Confirmed',
        secureData: 'Secure & encrypted data'
      },
      features: {
        badge: 'Features',
        title: 'Everything you need in one platform',
        subtitle: 'Stop using 5 different tools. Gestabiz has it ALL.',
        list: {
          appointments: {
            title: 'Appointment Management',
            description: 'Smart calendar with conflict prevention and Google Calendar sync.'
          },
          reminders: {
            title: 'Auto Reminders',
            description: 'WhatsApp, Email & SMS. Reduce no-shows by 70%. Your clients never forget.'
          },
          clients: {
            title: 'Client Management',
            description: 'Complete database with history, notes, and recurring client analysis.'
          },
          accounting: {
            title: 'Accounting System',
            description: 'VAT, ICA, Retention. Automatic P&L reports. Ready for Colombian DIAN.'
          },
          mobile: {
            title: 'Native Mobile App',
            description: 'iOS & Android. Manage your business from anywhere, anytime.'
          },
          jobs: {
            title: 'Job Portal',
            description: 'Post vacancies, manage applications, and find the talent you need.'
          },
          analytics: {
            title: 'Advanced Analytics',
            description: 'Interactive dashboards, real-time charts, and exportable reports.'
          },
          automation: {
            title: 'Automation',
            description: 'Confirmations, reminders, invoices. All automatic while you sleep.'
          },
          security: {
            title: 'Total Security',
            description: 'Data encryption, automatic backups, and privacy compliance.'
          }
        }
      },
      benefits: {
        badge: 'Real Benefits',
        title: 'Recover up to $1.5M pesos monthly in lost appointments',
        subtitle: "It's not magic, it's data. Our clients recover an average of 70% of appointments that were previously lost due to forgetfulness or cancellations.",
        stats: {
          noShows: {
            value: '70%',
            label: 'Reduction in No-Shows',
            description: 'Automatic reminders work'
          },
          timeSaved: {
            value: '8-12h',
            label: 'Weekly Time Saved',
            description: 'No more time wasted on manual scheduling'
          },
          bookings: {
            value: '35%',
            label: 'Increase in Bookings',
            description: 'Your clients book 24/7, even while you sleep'
          },
          roi: {
            value: '900%',
            label: 'Average ROI',
            description: 'Investment pays for itself in the first month'
          }
        },
        cta: 'Start Recovering Money Today',
        calculator: {
          lost: 'Monthly Lost Money',
          lostDescription: 'If you lose 25 appointments/month at $50,000 each',
          withGestabiz: 'With Gestabiz',
          recovered: 'You Recover',
          appointmentsRecovered: 'Appointments recovered (70%)',
          cost: 'AppointSync Cost',
          netProfit: 'Net Profit',
          paysSelf: '🎉 Investment pays for ITSELF in the first month'
        }
      },
      pricing: {
        badge: 'Plans & Pricing',
        title: 'Transparent pricing. No surprises.',
        subtitle: 'Cheaper than competitors. More features. Fair pricing for your business.'
      },
      testimonials: {
        badge: 'Testimonials',
        title: 'What our clients say',
        subtitle: 'More than 800 businesses in Colombia trust Gestabiz',
        list: {
          maria: {
            name: 'María González',
            business: 'Glamour Salon - Medellín',
            text: "I can't believe I didn't start sooner. My clients say it looks super professional and I'm much calmer. I recovered $720,000/month in lost appointments.",
            stat: '900% ROI'
          },
          carlos: {
            name: 'Dr. Carlos Ramírez',
            business: 'SmileCare Dental Office - Bogotá',
            text: "As a doctor, my time is gold. AppointSync gave me back 10 hours a week. Now I see more patients and my accountant is happy.",
            stat: '800% ROI'
          },
          juan: {
            name: 'Juan Martínez',
            business: 'Personal Trainer - Cali',
            text: 'I invested $29,900 and it changed my life. Now I look like a professional business. I even raised my prices. Best investment ever.',
            stat: '2000% ROI'
          }
        }
      },
      cta: {
        title: 'Ready to transform your business?',
        subtitle: 'Join over 800 businesses already saving time and increasing revenue with Gestabiz.',
        buttons: {
          trial: 'Start FREE for 30 Days',
          login: 'I already have an account'
        },
        benefits: {
          noCreditCard: 'No credit card required',
          cancelAnytime: 'Cancel anytime',
          spanishSupport: 'Spanish support'
        }
      },
      footer: {
        tagline: 'The #1 business management platform for Colombian SMBs.',
        product: {
          title: 'Product',
          features: 'Features',
          pricing: 'Pricing',
          integrations: 'Integrations',
          api: 'API'
        },
        resources: {
          title: 'Resources',
          blog: 'Blog',
          help: 'Help',
          tutorials: 'Tutorials',
          contact: 'Contact'
        },
        legal: {
          title: 'Legal',
          terms: 'Terms',
          privacy: 'Privacy',
          cookies: 'Cookies',
          licenses: 'Licenses'
        },
        copyright: '© 2025 Gestabiz. All rights reserved.',
        madeIn: 'Made with ❤️ in Colombia 🇨🇴'
      }
    },

    // Validations
    validation: {
      startTimeRequired: 'Start time is required',
      futureTimeRequired: 'Appointment time must be in the future',
      serviceRequired: 'Service selection is required',
      businessRequired: 'Business selection is required',
      clientNameRequired: 'Client name is required',
      dateRequired: 'Date is required',
      invalidTimeRange: 'Invalid time range'
    },

    // Authentication
    auth: {
      login: 'Sign In',
      logout: 'Sign Out',
      register: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      loginWithGoogle: 'Continue with Google',
      loginWithApple: 'Continue with Apple',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      signInHere: 'Sign in here',
      signUpHere: 'Sign up here',
      enterEmail: 'Enter your email',
      enterPassword: 'Enter your password',
      invalidCredentials: 'Invalid credentials',
      loginSuccess: 'Successfully signed in',
      registerSuccess: 'Account created successfully',
      logoutSuccess: 'Successfully signed out',
      welcomeMessage: 'Professional appointment management for your business',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signInDescription: 'Enter your credentials to access your account',
      signUpDescription: 'Create a new account to get started',
      name: 'Full Name',
      emailPlaceholder: 'Enter your email address',
      passwordPlaceholder: 'Enter your password',
      namePlaceholder: 'Enter your full name',
      confirmPasswordPlaceholder: 'Confirm your password',
      signingIn: 'Signing in...',
      creatingAccount: 'Creating account...',
      continueWithGoogle: 'Continue with Google',
      orContinueWith: 'Or continue with',
      fillAllFields: 'Please fill in all fields',
      passwordsDontMatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      loginSuccessful: 'Login successful',
      registrationSuccessful: 'Registration successful',
      checkEmailVerification: 'Please check your email for verification',
      loginError: 'Login error',
      registrationError: 'Registration error',
      redirectingToGoogle: 'Redirecting to Google...',
      googleLoginError: 'Google login error',
      enterEmailFirst: 'Please enter your email first',
      passwordResetSent: 'Password reset email sent',
      passwordResetError: 'Password reset error',
      termsAgreement: 'By continuing, you agree to our',
      termsOfService: 'Terms of Service',
      and: 'and',
      privacyPolicy: 'Privacy Policy',
      or: 'or',
      loginAsDemo: 'Login as Demo User',
      continueBooking: 'Sign in to continue with your booking',
      accountInactive: 'Your account is inactive. You will not be able to sign in until you reactivate your account',
      mustSignIn: 'You must sign in to create an appointment',
      rememberMe: 'Remember me'
    },

    // Email Verification Modal
    emailVerification: {
      title: 'Verify your email',
      description: 'We sent a verification email to:',
      verified: 'I verified my email',
      verifying: 'Verifying...',
      resend: 'Resend email',
      resending: 'Resending...',
      step1: 'Check your inbox (and spam folder)',
      step2: 'Click the verification link',
      step3: 'Return here and click "I verified my email"',
      helpText: 'Did not receive the email? Check your spam folder or resend the email.',
      resendSuccess: 'Verification email resent',
      resendError: 'Error resending email:',
      unexpectedError: 'Unexpected error while resending email',
      checkError: 'Error checking verification:',
      verifySuccess: 'Email verified successfully!',
      notVerified: 'Email not yet verified. Please check your inbox.',
      verifyUnexpectedError: 'Error checking email verification status',
    },

    // Account Inactive Modal
    accountInactive: {
      title: 'Inactive Account',
      message: 'Your account has been deactivated. Do you want to reactivate it now?',
      reactivate: 'Yes, reactivate',
      reactivating: 'Reactivating...',
      logout: 'No, sign out',
      infoText: 'If you reactivate your account you will be able to access it immediately.',
      reactivateError: 'Error reactivating account',
      reactivateSuccess: 'Account reactivated successfully',
      unexpectedError: 'Unexpected error while reactivating account',
    },

    // Navigation
    nav: {
      dashboard: 'Dashboard',
      calendar: 'Calendar',
      appointments: 'Appointments',
      clients: 'Clients',
      services: 'Services',
      reports: 'Reports',
      settings: 'Settings',
      profile: 'Profile',
      business: 'Business',
      employees: 'Employees'
    },

    // Business Registration
    business: {
      management: {
        title: 'Business Management',
        subtitle: 'Manage your business information, locations and services',
        configure_title: 'Set up your business',
        configure_description: 'First, configure your business basic information',
        create_business: 'Create Business',
        info_description: 'Basic and contact information for your business',
        settings_title: 'Business Settings',
        settings_description: 'General settings for how your business operates',
        updated: 'Business information updated'
      },
      registration: {
        title: 'Register Your Business',
  business_description: 'Create your business profile to start managing appointments',
        basic_info: 'Basic Information',
        business_name: 'Business Name',
        category: 'Category',
        description: 'Description',
        contact_info: 'Contact Information',
        phone: 'Phone',
        email: 'Email',
        website: 'Website',
        location: 'Location',
        address: 'Address',
        city: 'City',
        country: 'Country',
        postal_code: 'Postal Code',
        coordinates: 'Coordinates',
        detect_location: 'Detect Location',
        location_detected: 'Location detected successfully',
        location_error: 'Could not detect location',
        location_not_supported: 'Geolocation is not supported',
        business_hours: 'Business Hours',
        open: 'Open',
        services: 'Services',
        add_service: 'Add Service',
        service: 'Service',
        remove: 'Remove',
        service_name: 'Service Name',
        service_category: 'Category',
  service_description: 'Description',
        duration: 'Duration',
        minutes: 'minutes',
        price: 'Price',
        create_business: 'Create Business',
        creating: 'Creating...',
        success: 'Business created successfully',
        error: 'Error creating business',
        validation: {
          required_fields: 'Please fill in all required fields',
          at_least_one_service: 'Please add at least one service',
          clientNameRequired: 'Client name is required'
        },
        placeholders: {
          business_name: 'Enter your business name',
          category: 'Select a category',
          description: 'Describe your business',
          phone: '+1 (555) 123-4567',
          website: 'https://www.yourbusiness.com',
          address: 'Street address',
          city: 'City',
          country: 'Country',
          postal_code: 'Postal code',
          latitude: 'Latitude',
          longitude: 'Longitude',
          service_name: 'e.g. Haircut',
          service_category: 'e.g. Hair Services',
          service_description: 'Brief description of the service'
        },
        days: {
          monday: 'Monday',
          tuesday: 'Tuesday',
          wednesday: 'Wednesday',
          thursday: 'Thursday',
          friday: 'Friday',
          saturday: 'Saturday',
          sunday: 'Sunday'
        }
      },
      categories: {
        beauty_salon: 'Beauty Salon',
        barbershop: 'Barbershop',
        medical: 'Medical',
        dental: 'Dental',
        veterinary: 'Veterinary',
        fitness: 'Fitness',
        consulting: 'Consulting',
        automotive: 'Automotive',
        education: 'Education',
        legal: 'Legal',
        real_estate: 'Real Estate',
        other: 'Other'
      },
      hours: {
        closed: 'Closed'
      }
    },

    // Employee Management
    employee: {
      join: {
        title: 'Join a Business',
        description: 'Search and request to join a business as an employee',
        search_placeholder: 'Search by business name, category, or city...',
        request_to_join: 'Request to Join',
        request_form_title: 'Join Request',
        request_form_description: 'Send a request to join {businessName}',
        message_label: 'Message (Optional)',
        message_placeholder: 'Tell the business owner why you want to join their team...',
        message_hint: 'Include your experience and skills relevant to this business',
        send_request: 'Send Request',
        sending: 'Sending...',
        request_sent_success: 'Join request sent successfully',
        request_error: 'Error sending join request',
        no_results_title: 'No businesses found',
        no_results_description: 'Try adjusting your search terms',
        no_businesses_title: 'No businesses available',
        no_businesses_description: 'There are no businesses you can join at the moment'
      },
      requests: {
        pending_title: 'Pending Requests',
        pending_description: 'Review and approve employee join requests',
        processed_title: 'Processed Requests', 
        processed_description: 'Previously reviewed requests',
        approve: 'Approve',
        reject: 'Reject',
        requested_on: 'Requested on',
        processed_on: 'Processed on',
        approved_success: 'Employee request approved',
        rejected_success: 'Employee request rejected',
        error: 'Error processing request',
        no_requests_title: 'No employee requests',
        no_requests_description: 'When users request to join your business, they will appear here',
        status: {
          pending: 'Pending',
          approved: 'Approved',
          rejected: 'Rejected'
        }
      }
    },

    // Profile
    profile: {
      title: 'Profile',
      personal_info: 'Personal Information',
      name: 'Full Name',
  username: 'Username',
  username_hint: 'Letters, numbers, dots and underscores only.',
      email: 'Email',
      phone: 'Phone',
      avatar: 'Profile Picture',
      upload_avatar: 'Upload Picture',
      change_avatar: 'Change Picture',
      business_info: 'Business Information',
      role: 'Role',
      permissions: 'Permissions',
      joined_on: 'Joined on',
      save_changes: 'Save Changes',
      saving: 'Saving...',
      success: 'Profile updated successfully',
      error: 'Error updating profile'
    },

    // Settings
    settings: {
      title: 'Settings',
      subtitle: 'Configure your account and preferences',
      profile: 'Profile',
      appearance: 'Appearance',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      language: 'Language',
      spanish: 'Español',
      english: 'English',
      notifications: 'Notifications',
      email_notifications: 'Email Notifications',
      push_notifications: 'Push Notifications',
      browser_notifications: 'Browser Notifications',
      whatsapp_notifications: 'WhatsApp Notifications',
      reminder_24h: '24 hour reminders',
      reminder_1h: '1 hour reminders',
      reminder_15m: '15 minute reminders',
      daily_digest: 'Daily digest',
      weekly_report: 'Weekly reports',
      save_preferences: 'Save Preferences',
      preferences_saved: 'Preferences saved successfully',
      // Tabs
      tabs: {
        general: 'General Settings',
        profile: 'Profile',
        notifications: 'Notifications',
        businessPreferences: 'Business Preferences',
        employeePreferences: 'Employee Preferences',
        clientPreferences: 'Client Preferences',
        dangerZone: 'Danger Zone'
      },
      // Theme section
      themeSection: {
        title: 'Appearance and System',
        subtitle: 'Customize the theme and language of the application',
        themeLabel: 'Interface theme',
        themeDescription: 'Select your preferred theme for the application',
        themes: {
          light: {
            label: 'Light',
            description: 'Light colored interface'
          },
          dark: {
            label: 'Dark',
            description: 'Dark colored interface'
          },
          system: {
            label: 'System',
            description: 'According to system preferences'
          }
        },
        currentTheme: 'Current theme: {theme}',
        systemThemeNote: 'The theme automatically changes according to your operating system preferences',
        changeAnytime: 'You can change the theme at any time'
      },
      // Language section
      languageSection: {
        label: 'Interface Language',
        description: 'Select the interface language'
      },
      // Admin Business Preferences
      businessInfo: {
        title: 'Business Information',
        subtitle: 'Basic business information',
        tabs: {
          info: 'Business Information',
          notifications: 'Business Notifications',
          tracking: 'History'
        },
        basicInfo: {
          title: 'Basic Information',
          nameLabel: 'Business Name *',
          namePlaceholder: 'Enter business name',
          descriptionLabel: 'Description',
          descriptionPlaceholder: 'Describe your business...'
        },
        contactInfo: {
          title: 'Contact Information',
          phoneLabel: 'Phone',
          phonePlaceholder: 'Phone number',
          emailLabel: 'Email',
          emailPlaceholder: 'contact@business.com',
          websiteLabel: 'Website',
          websitePlaceholder: 'https://www.business.com'
        },
        addressInfo: {
          title: 'Address',
          addressLabel: 'Address',
          addressPlaceholder: 'Street, number, neighborhood',
          cityLabel: 'City',
          cityPlaceholder: 'City',
          stateLabel: 'Department/State',
          statePlaceholder: 'Department or State'
        },
        legalInfo: {
          title: 'Legal Information',
          legalNameLabel: 'Legal Name',
          legalNamePlaceholder: 'Legal business name',
          taxIdLabel: 'Tax ID / NIT',
          taxIdPlaceholder: 'Tax identification number'
        },
        operationSettings: {
          title: 'Operation Settings',
          allowOnlineBooking: 'Allow online bookings',
          autoConfirm: 'Automatic confirmation',
          autoReminders: 'Automatic reminders',
          showPrices: 'Show prices publicly'
        },
        nameRequired: 'Business name is required',
        saveSettings: 'Save Settings'
      },
      // Employee Preferences
      employeePrefs: {
        title: 'Employee Preferences',
        subtitle: 'Configure your work preferences',
        availability: {
          title: 'Availability',
          availableForAppointments: 'Available for new appointments',
          notifyNewAssignments: 'Notify new assignments',
          appointmentReminders: 'Appointment reminders'
        },
        schedule: {
          title: 'My Work Schedule',
          workingDay: 'Working day',
          restDay: 'Rest day',
          startTime: 'Start',
          endTime: 'End',
          lunchBreak: 'Lunch',
          saveSchedule: 'Save Schedules'
        },
        messages: {
          title: 'Client Messages',
          allowMessages: 'Allow messages from clients',
          description: 'When enabled, clients can send you direct messages'
        },
        professionalInfo: {
          title: 'Professional Information',
          subtitle: 'Your experience and preferred work type',
          summaryLabel: 'Professional Summary',
          summaryPlaceholder: 'Describe your experience, skills, and specialties...',
          yearsExperienceLabel: 'Years of Experience',
          workTypeLabel: 'Preferred Work Type',
          workTypes: {
            fullTime: 'Full Time',
            partTime: 'Part Time',
            contract: 'Contract',
            flexible: 'Flexible'
          }
        },
        salary: {
          title: 'Salary Expectations',
          minLabel: 'Minimum Expected Salary',
          maxLabel: 'Maximum Expected Salary',
          minPlaceholder: 'Min amount',
          maxPlaceholder: 'Max amount',
          invalidRange: 'The minimum salary cannot be greater than the maximum'
        },
        specializations: {
          title: 'Specializations',
          noSpecializations: 'No specializations added yet',
          newPlaceholder: 'New specialization',
          addButton: 'Add'
        },
        languages: {
          title: 'Languages',
          noLanguages: 'No languages added yet',
          newPlaceholder: 'Language (e.g., English - Advanced)',
          addButton: 'Add'
        },
        certifications: {
          title: 'Certifications and Licenses',
          noCertifications: 'No certifications added yet',
          addButton: 'Add Certification',
          form: {
            nameLabel: 'Certification Name',
            namePlaceholder: 'Name of certification or license',
            issuerLabel: 'Issuing Entity',
            issuerPlaceholder: 'Entity that issued the certification',
            dateLabel: 'Date Obtained',
            datePlaceholder: 'MM/YYYY',
            urlLabel: 'Credential URL (optional)',
            urlPlaceholder: 'https://...',
            cancelButton: 'Cancel',
            saveButton: 'Save'
          },
          issued: 'Issued',
          verifyCredential: 'Verify credential',
          deleteButton: 'Delete'
        },
        links: {
          title: 'Professional Links',
          portfolioLabel: 'Portfolio / Website',
          portfolioPlaceholder: 'https://your-portfolio.com',
          linkedinLabel: 'LinkedIn',
          linkedinPlaceholder: 'https://linkedin.com/in/yourprofile'
        },
        saveButton: 'Save Preferences',
        resetButton: 'Reset'
      },
      // Client Preferences
      clientPrefs: {
        title: 'Client Preferences',
        subtitle: 'Configure your booking preferences',
        bookingPrefs: {
          title: 'Booking Preferences',
          appointmentReminders: 'Appointment reminders',
          emailConfirmation: 'Email confirmation',
          promotionNotifications: 'Promotion notifications',
          savePaymentMethods: 'Save payment methods'
        },
        advanceTime: {
          title: 'Preferred Advance Time',
          label: 'Preferred notice time for appointments',
          options: {
            sameDay: 'Same day',
            oneDay: '1 day',
            twoDays: '2 days',
            threeDays: '3 days',
            oneWeek: '1 week'
          }
        },
        serviceHistory: {
          title: 'Service History',
          label: 'Save my service history for recommendations',
          description: 'We use this to suggest similar services'
        },
        paymentMethods: {
          title: 'Payment Methods',
          noneAdded: 'No payment methods added',
          types: {
            card: 'Credit/Debit Card',
            pse: 'PSE',
            cash: 'Cash',
            transfer: 'Bank Transfer'
          },
          addButton: 'Add Payment Method'
        },
        savePreferences: 'Save Preferences'
      },
      // Danger Zone
      dangerZone: {
        title: 'Danger Zone',
        subtitle: 'Irreversible account actions',
        deactivate: {
          title: 'Deactivate Account',
          description: 'Temporarily suspend your account. You can reactivate it anytime.',
          button: 'Deactivate Account',
          confirmTitle: 'Are you sure you want to deactivate your account?',
          confirmDescription: 'Your account will be temporarily suspended. All your data will be preserved and you can reactivate it anytime by signing in again.',
          inputLabel: 'Confirm your email to continue:',
          inputPlaceholder: 'your@email.com',
          checkbox: 'I understand that my account will be temporarily suspended',
          cancel: 'Cancel',
          confirm: 'Yes, deactivate my account'
        },
        delete: {
          title: 'Delete Account',
          description: 'Permanently delete your account and all associated data. This action cannot be undone.',
          button: 'Delete Account',
          confirmTitle: 'Delete account permanently',
          warningTitle: 'Warning: This action is irreversible',
          warningDescription: 'You are about to permanently delete your account and all associated data. This includes:',
          warningItems: {
            profile: 'Your profile and personal information',
            appointments: 'All your appointments (past and future)',
            history: 'Your complete service history',
            payments: 'Payment history and methods',
            preferences: 'All your preferences and settings'
          },
          confirmText: 'Type "DEACTIVATE ACCOUNT" to confirm',
          confirmPlaceholder: 'DEACTIVATE ACCOUNT',
          mustTypeCorrectly: 'You must type "DEACTIVATE ACCOUNT" to confirm',
          cancel: 'Cancel',
          confirm: 'Yes, delete permanently',
          processing: 'Processing...'
        }
      }
    },

    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back, {name}!',
  overview: 'Here\'s what\'s happening with your business today',
  overview_client: 'Here\'s what\'s happening with your appointments today',
      quick_stats: 'Quick Stats',
      recent_appointments: 'Recent Appointments',
      upcoming_appointments: 'Upcoming Appointments',
      total_appointments: 'Total Appointments',
      completed_appointments: 'Completed',
      pending_appointments: 'Pending',
      cancelled_appointments: 'Cancelled',
      register_business: 'Register Business',
      join_business: 'Join Business',
      no_business_title: 'No Business Registered',
      no_business_description: 'Register your business or join an existing one to start managing appointments',
      register_business_description: 'Create your business profile and start managing appointments',
      join_business_description: 'Request to join an existing business as an employee',
      todayAppointments: 'Today\'s Appointments',
      totalClients: 'Total Clients',
      monthlyRevenue: 'Monthly Revenue',
      upcomingToday: 'Upcoming Today',
      quickActions: 'Quick Actions',
      recentActivity: 'Recent Activity',
      comingSoon: 'Coming soon...',
      upcomingWeek: 'Upcoming Week',
      nextSevenDays: 'Next 7 Days',
      todaySchedule: 'Today\'s Schedule',
      noAppointmentsToday: 'No appointments scheduled for today',
      noUpcomingAppointments: 'No upcoming appointments',
      totalRevenue: 'Total Revenue',
      thisMonth: 'This Month',
      avgAppointmentValue: 'Avg Appointment Value',
      perAppointment: 'Per Appointment',
      weeklyAppointments: 'Weekly Appointments',
      appointmentStatus: 'Appointment Status'
    },

    // Search
    search: {
      types: {
        services: 'Services',
        businesses: 'Businesses',
        categories: 'Categories',
        users: 'Professionals'
      },
      placeholders: {
        services: 'Search services...',
        businesses: 'Search businesses...',
        categories: 'Search categories...',
        users: 'Search professionals...'
      },
      results: {
        viewAll: 'View all results →',
        noResults: 'No results found',
        tryDifferent: 'Try different search terms',
        independentService: 'Independent service',
        noCategory: 'No category',
        locationNotSpecified: 'Location not specified',
        serviceCategory: 'Service category',
        userNoName: 'User without name',
        independentProfessional: 'Independent professional',
        professionalServices: 'Service professional'
      },
      sorting: {
        relevance: 'Relevance',
        balanced: 'Balanced (Location + Rating)',
        distance: 'Nearest',
        rating: 'Best rated',
        newest: 'Newest',
        oldest: 'Oldest'
      },
      filters: {
        filters: 'Filters',
        filter: 'Filter',
        active: 'Active',
        enableLocation: 'Enable location to see distances',
        enableLocationShort: 'Enable location'
      },
      resultsPage: {
        title: 'Search results',
        resultsFor: 'result for',
        resultsForPlural: 'results for',
        in: 'in',
        searching: 'Searching for results...',
        noResultsTitle: 'No results found',
        noResultsDescription: 'Try searching with other terms or change the search type',
        typeLabels: {
          service: 'Service',
          business: 'Business',
          category: 'Category',
          user: 'Professional'
        }
      }
    },

    // Appointments
    appointments: {
      title: 'Appointments',
      new_appointment: 'New Appointment',
      edit_appointment: 'Edit Appointment',
      create: 'Create Appointment',
      edit: 'Edit Appointment',
      appointment_details: 'Appointment Details',
      client_name: 'Client Name',
      client_email: 'Client Email',
      client_phone: 'Client Phone',
      service: 'Service',
      selectService: 'Select a service',
      employee: 'Employee',
      date: 'Date',
      startTime: 'Start Time',
      endTime: 'End Time (Auto-calculated)',
      time: 'Time',
      duration: 'Duration',
      price: 'Price',
      notes: 'Notes',
      notesPlaceholder: 'Additional notes about the appointment...',
      status: 'Status',
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show',
      create_appointment: 'Create Appointment',
      update_appointment: 'Update Appointment',
      cancel_appointment: 'Cancel Appointment',
      complete_appointment: 'Complete Appointment',
      delete_appointment: 'Delete Appointment',
      appointment_created: 'Appointment created successfully',
      appointment_updated: 'Appointment updated successfully',
      appointment_cancelled: 'Appointment cancelled successfully',
      appointment_completed: 'Appointment completed successfully',
      appointment_deleted: 'Appointment deleted successfully',
      no_appointments: 'No appointments found',
      filter_by_status: 'Filter by status',
      filter_by_date: 'Filter by date',
      all_statuses: 'All statuses',
      today: 'Today',
      this_week: 'This week',
      this_month: 'This month',
      custom_range: 'Custom range',
      // Wizard errors
      wizard_errors: {
        professionalNotOffersService: 'This professional does not offer the selected service',
        cannotVerifyCompatibility: 'Could not verify professional compatibility',
        selectDate: 'Please select a date for the appointment',
        selectTime: 'Please select a time for the appointment',
        professionalNotAvailable: 'This professional is not available for bookings at this time',
        professionalCannotAccept: 'This professional cannot accept appointments. Please select another professional',
        missingRequiredData: 'Missing required data to create the appointment',
        mustLogin: 'You must log in to create an appointment',
        errorCreating: 'Error creating appointment',
        errorModifying: 'Error modifying appointment',
      },
      wizard_success: {
        created: 'Appointment created successfully!',
        modified: 'Appointment modified successfully!',
      },
    },

    // Clients
    clients: {
      title: 'Clients',
      new_client: 'New Client',
      edit_client: 'Edit Client',
      client_details: 'Client Details',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      notes: 'Notes',
      total_appointments: 'Total Appointments',
      last_appointment: 'Last Appointment',
      next_appointment: 'Next Appointment',
      create_client: 'Create Client',
      update_client: 'Update Client',
      delete_client: 'Delete Client',
      client_created: 'Client created successfully',
      client_updated: 'Client updated successfully',
      client_deleted: 'Client deleted successfully',
      no_clients: 'No clients found',
      search_clients: 'Search clients...',
      frequent_clients: 'Frequent Clients',
      inactive_clients: 'Inactive Clients',
      send_whatsapp: 'Send WhatsApp',
      whatsapp_message: 'Hi! We miss you. Would you like to schedule a new appointment?'
    },

    // Services
    services: {
      title: 'Services',
      new_service: 'New Service',
      edit_service: 'Edit Service',
      service_details: 'Service Details',
      name: 'Name',
      category: 'Category',
      description: 'Description',
      duration: 'Duration',
      price: 'Price',
      color: 'Color',
      active: 'Active',
      create_service: 'Create Service',
      update_service: 'Update Service',
      delete_service: 'Delete Service',
      service_created: 'Service created successfully',
      service_updated: 'Service updated successfully',
      service_deleted: 'Service deleted successfully',
      no_services: 'No services found',
      minutes: 'minutes'
    },

    // Reports
    reports: {
      title: 'Reports',
      business_overview: 'Business Overview',
      period_selection: 'Period Selection',
  this_quarter: 'This Quarter',
      this_week: 'This Week',
      this_month: 'This Month',
      last_year: 'Last Year',
      custom_period: 'Custom Period',
      start_date: 'Start Date',
      end_date: 'End Date',
      generate_report: 'Generate Report',
      appointments_by_status: 'Appointments by Status',
      appointments_by_day: 'Appointments by Day',
      appointments_by_hour: 'Appointments by Hour',
      revenue_overview: 'Revenue Overview',
      top_services: 'Top Services',
      employee_performance: 'Employee Performance',
      most_active_days: 'Most Active Days',
      peak_hours: 'Peak Hours',
      total_revenue: 'Total Revenue',
      average_appointment_value: 'Average Appointment Value',
      client_retention: 'Client Retention',
      new_clients: 'New Clients',
      returning_clients: 'Returning Clients',
      no_data_available: 'No data available for selected period'
    },
    admin: {
      clientManagement: {
        search_placeholder: 'Search clients by name, email or phone...',
        filter_by_status: 'Filter by status',
        all_statuses: 'All statuses',
        status: {
          active: 'Active',
          inactive: 'Inactive',
          blocked: 'Blocked',
          unknown: 'Unknown',
          active_plural: 'Active',
          inactive_plural: 'Inactive',
          blocked_plural: 'Blocked'
        },
        tabs: {
          all: 'All',
          recurring: 'Recurring',
          at_risk: 'At Risk',
          lost: 'Lost'
        },
        empty: {
          title: 'No clients found',
          description_search: 'Try different search terms',
          description_category: 'There are no clients in this category'
        },
        badges: {
          total_appointments: 'Total Appointments',
          total_value: 'Total Value'
        },
        last_appointment_prefix: 'Last appointment',
        never: 'Never',
        actions: {
          schedule: 'Schedule',
          contact: 'Contact'
        },
        risk: {
          at_risk: 'Client at risk ({days} days)',
          lost: 'Lost client ({days} days)'
        },
        whatsapp: {
          missing: 'Client has no WhatsApp number',
          message_template: 'Hi {name}, hope you are well. Would you like to book your next appointment?'
        }
      },
      comprehensiveReports: {
        title: 'Advanced Reports',
        subtitle: 'Detailed analysis of your business performance',
        actions: { update: 'Refresh', updating: 'Refreshing...' },
        metrics: {
          total_appointments: 'Total Appointments',
          revenue: 'Revenue',
          average: 'Average',
          completion_rate: 'Completion Rate',
          new_in_period: 'new this period'
        },
        tabs: { summary: 'Summary' },
        descriptions: {
          by_status: 'Distribution by status in the selected period',
          client_metrics: 'Retention and growth metrics',
          peak_hours: 'Days and hours with the most appointments scheduled',
          employee_performance: 'Productivity and efficiency statistics',
          top_services: 'Most demanded and profitable services',
          recurring_clients: 'Frequent clients and activity status analysis'
        },
        cards: {
          peak_hours: 'Highest Demand Hours',
          recurring_clients: 'Recurring Clients',
          client_analysis: 'Client Analysis'
        },
        labels: {
          active_clients: 'Active Clients',
          retention_rate: 'Retention Rate',
          efficiency: 'efficiency',
          average_short: 'avg',
          days: 'days',
          at: 'at',
          last_visit: 'Last visit'
        },
        status: {
          active: 'Active',
          at_risk: 'At Risk',
          lost: 'Lost'
        },
        whatsapp: {
          missing: 'This client has no WhatsApp configured',
          message_template: 'Hi {name}! We noticed it has been a while since your last visit. Would you like to schedule a new appointment? We miss you! 😊'
        },
        errors: {
          generate_failed: 'Could not generate reports'
        }
      }
    },

    // Calendar
    calendar: {
      title: 'Calendar',
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      agenda: 'Agenda',
      no_appointments: 'No appointments scheduled',
      time_slot_available: 'Available',
      time_slot_busy: 'Busy',
      view_details: 'View Details',
      book_appointment: 'Book Appointment'
    },

    // Locations
    locations: {
      title: 'Locations',
      new_location: 'New Location',
      edit_location: 'Edit Location',
      location_details: 'Location Details',
      name: 'Name',
      address: 'Address',
      city: 'City',
      country: 'Country',
      postal_code: 'Postal Code',
      phone: 'Phone',
      email: 'Email',
      active: 'Active',
      create_location: 'Create Location',
      update_location: 'Update Location',
      delete_location: 'Delete Location',
      location_created: 'Location created successfully',
      location_updated: 'Location updated successfully',
      location_deleted: 'Location deleted successfully',
      no_locations: 'No locations found',
      main_location: 'Main Location'
    },

    // Banner Cropper
    bannerCropper: {
      title: 'Crop Banner',
      instructions: 'Adjust the rectangular area for the banner (16:9)',
      confirm: 'Confirm',
    },

    reviews: {
      title: 'Reviews',
      leaveReview: 'Leave a Review',
      reviewDescription: 'Share your experience with others',
      rating: 'Rating',
      comment: 'Comment',
      commentPlaceholder: 'Tell us about your experience...',
      shareExperience: 'Your review will be posted anonymously',
      submitReview: 'Submit Review',
      submitSuccess: 'Review submitted successfully',
      anonymous: 'Anonymous User',
      verified: 'Verified',
      hidden: 'Hidden',
      hide: 'Hide',
      show: 'Show',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this review?',
      employeeLabel: 'Professional',
      businessResponse: 'Business Response',
      respond: 'Respond',
      responsePlaceholder: 'Write your response...',
      submitResponse: 'Submit Response',
      helpful: 'Helpful',
      overallRating: 'Overall Rating',
      basedOn: 'Based on {count} reviews',
      ratingDistribution: 'Rating Distribution',
      filterByRating: 'Filter by Rating',
      allRatings: 'All Ratings',
      searchReviews: 'Search reviews...',
      noReviews: 'No reviews yet',
      noReviewsDescription: 'Be the first to leave a review',
      review: 'review',
      reviewsPlural: 'reviews',
      ratings: {
        poor: 'Poor',
        fair: 'Fair',
        good: 'Good',
        veryGood: 'Very Good',
        excellent: 'Excellent',
      },
      errors: {
        ratingRequired: 'Please select a rating',
        submitFailed: 'Failed to submit review',
        loadFailed: 'Failed to load reviews',
      },
    },

    // Employee Hierarchy Management
    employees: {
      management: {
        title: 'Employee Management',
        subtitle: 'Hierarchical view with performance metrics',
        totalEmployees: 'Total Employees',
        byLevel: 'By Level',
        avgOccupancy: 'Average Occupancy',
        avgRating: 'Average Rating',
        listView: 'List',
        mapView: 'Map',
        filters: 'Filters',
        clearFilters: 'Clear filters',
        employeesShown: 'employees shown',
        noEmployees: 'No employees found',
        loading: 'Loading employees...',
        error: 'Error loading employees',
        retry: 'Retry',
      },
      filters: {
        search: 'Search by name or email',
        searchPlaceholder: 'Type to search...',
        hierarchyLevel: 'Hierarchy Level',
        allLevels: 'All Levels',
        employeeType: 'Employee Type',
        allTypes: 'All Types',
        department: 'Department',
        allDepartments: 'All Departments',
        occupancyRange: 'Occupancy Range',
        ratingRange: 'Rating Range',
        activeFilters: 'Active Filters',
        clear: 'Clear',
      },
      levels: {
        0: 'Owner',
        1: 'Administrator',
        2: 'Manager',
        3: 'Team Lead',
        4: 'Staff',
      },
      hierarchy: {
        changeLevel: 'Change hierarchy level for {name}',
        level: 'Level',
        note: 'Note',
        noteLevel: 'Level determines position in organizational chart',
        noteReports: 'Update supervisor separately if needed',
        updateSuccess: 'Hierarchy level updated successfully',
        updateError: 'Error updating hierarchy level',
        confirmChange: 'Are you sure you want to change the level?',
      },
      types: {
        fullTime: 'Full Time',
        partTime: 'Part Time',
        contractor: 'Contractor',
        intern: 'Intern',
      },
      employeeTypes: {
        service_provider: 'Service Provider',
        support_staff: 'Support Staff',
        location_manager: 'Location Manager',
        manager: 'Manager',
      },
      departments: {
        sales: 'Sales',
        service: 'Service',
        support: 'Support',
        admin: 'Administration',
      },
      card: {
        viewProfile: 'View Profile',
        edit: 'Edit',
        assignSupervisor: 'Assign Supervisor',
        active: 'Active',
        inactive: 'Inactive',
        activate: 'Activate Employee',
        deactivate: 'Deactivate Employee',
        confirmDeactivate: 'Are you sure you want to deactivate this employee? They will not be able to receive appointments.',
        confirmActivate: 'Are you sure you want to reactivate this employee?',
        deactivateSuccess: 'Employee deactivated successfully',
        activateSuccess: 'Employee activated successfully',
        toggleError: 'Error updating employee status',
        supervisor: 'Supervisor',
        subordinates: 'Subordinates',
        noSupervisor: 'No Supervisor',
        occupancy: 'Occupancy',
        rating: 'Rating',
        revenue: 'Revenue',
      },
      list: {
        sortBy: 'Sort by',
        name: 'Name',
        level: 'Level',
        occupancy: 'Occupancy',
        rating: 'Rating',
        revenue: 'Revenue',
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
      },
      map: {
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        resetZoom: 'Reset Zoom',
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        zoom: 'Zoom',
      },
      actions: {
        updateSuccess: 'Employee updated successfully',
        updateError: 'Failed to update employee',
        assignSuccess: 'Supervisor assigned successfully',
        assignError: 'Failed to assign supervisor',
        deleteSuccess: 'Employee removed successfully',
        deleteError: 'Failed to remove employee',
      },
      metrics: {
        appointments: 'Appointments',
        completed: 'Completed',
        pending: 'Pending',
        cancelled: 'Cancelled',
        totalRevenue: 'Total Revenue',
        avgRating: 'Avg Rating',
        occupancyRate: 'Occupancy Rate',
      },
    },

    // Physical Resources System
    businessResources: {
      title: 'Resource Management',
      subtitle: 'Manage rooms, tables, courts and more',
      addResource: 'Add Resource',
      editResource: 'Edit Resource',
      deleteResource: 'Delete Resource',
      noResources: 'No resources registered',
      filterByType: 'Filter by type',
      allTypes: 'All types',
      
      form: {
        name: 'Resource Name',
        namePlaceholder: 'E.g: Room 101, VIP Table, Court #1',
        type: 'Resource Type',
        location: 'Location',
        selectLocation: 'Select location',
        capacity: 'Capacity',
        capacityPlaceholder: 'Number of people',
        pricePerHour: 'Price per Hour',
        pricePlaceholder: 'Price in COP',
        description: 'Description',
        descriptionPlaceholder: 'Describe the resource features...',
        amenities: 'Services / Amenities',
        amenitiesPlaceholder: 'WiFi, Air Conditioning, TV, etc. (comma separated)',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },

      types: {
        room: 'Room',
        table: 'Table',
        court: 'Court',
        desk: 'Desk',
        equipment: 'Equipment',
        vehicle: 'Vehicle',
        space: 'Space',
        lane: 'Lane',
        field: 'Field',
        station: 'Station',
        parking_spot: 'Parking Spot',
        bed: 'Bed',
        studio: 'Studio',
        meeting_room: 'Meeting Room',
        other: 'Other',
      },

      table: {
        name: 'Name',
        type: 'Type',
        location: 'Location',
        capacity: 'Capacity',
        price: 'Price/Hour',
        status: 'Status',
        actions: 'Actions',
      },

      status: {
        available: 'Available',
        occupied: 'Occupied',
        maintenance: 'Maintenance',
        inactive: 'Inactive',
      },

      actions: {
        createSuccess: 'Resource created successfully',
        createError: 'Error creating resource',
        updateSuccess: 'Resource updated successfully',
        updateError: 'Error updating resource',
        deleteSuccess: 'Resource deleted successfully',
        deleteError: 'Error deleting resource',
        confirmDelete: 'Are you sure you want to delete this resource?',
        deleteWarning: 'This action cannot be undone',
      },

      stats: {
        totalResources: 'Total Resources',
        activeResources: 'Active Resources',
        occupancyRate: 'Occupancy Rate',
        totalRevenue: 'Total Revenue',
      },
    },

    // Absence and Vacation System
    absences: {
      title: 'Request Absence',
      subtitle: 'Request time off or vacation',
      absenceType: 'Absence Type',
      selectType: 'Select type',
      startDate: 'Start Date',
      endDate: 'End Date',
      reason: 'Reason',
      reasonPlaceholder: 'Describe the reason for your absence...',
      employeeNotes: 'Additional Notes',
      notesPlaceholder: 'Any additional information...',
      daysRequested: 'Days Requested',
      vacationBalance: 'Vacation Balance',
      daysAvailable: 'days available',
      daysRemaining: 'days remaining',
      insufficientBalance: 'Insufficient vacation balance',
      affectedAppointments: 'Affected Appointments',
      appointment: 'appointment',
      appointments: 'appointments',
      noAppointments: 'No appointments affected',
      loadingAppointments: 'Loading appointments...',
      submit: 'Request Absence',
      submitting: 'Submitting...',
      cancel: 'Cancel',
      success: 'Absence request submitted successfully',
      error: 'Error submitting absence request',
      types: {
        vacation: '🌴 Vacation',
        emergency: '🚨 Emergency',
        sick_leave: '🤒 Sick Leave',
        personal: '👤 Personal',
        other: '📋 Other',
      },
      validation: {
        selectType: 'Select absence type',
        selectStartDate: 'Select start date',
        selectEndDate: 'Select end date',
        endAfterStart: 'End date must be after start date',
        reasonRequired: 'Reason is required',
        maxDays: 'Request cannot exceed 365 days',
      },
      disabledDays: {
        weekend: 'Weekend',
        saturday: 'Saturday - Weekend',
        sunday: 'Sunday - Weekend',
        nonWorkDay: 'Non-working day',
        holiday: 'Public Holiday',
      },
      invalidDays: {
        title: 'Non-working days',
        message: 'The following days are not in your work schedule: {days}',
        instruction: 'Please select only days when you work.',
      },
      holidays: {
        title: 'Public holidays in range',
        message: 'The following days are public holidays and cannot be requested as absence: {days}',
        instruction: 'Adjust your dates excluding these days.',
      },
      affected: {
        title: '{count} appointment affected',
        titlePlural: '{count} appointments affected',
        messageSingle: 'This appointment will be cancelled if the absence is approved',
        messagePlural: 'These appointments will be cancelled if the absence is approved',
      },
      labels: {
        reasonRequired: 'Reason for Absence *',
        reasonPlaceholder: 'Briefly describe the reason for your absence...',
        notesLabel: 'Additional Notes (optional)',
        notesPlaceholder: 'Additional information you want to share...',
        cancelButton: 'Cancel',
        submitButton: 'Submit Request',
        submittingButton: 'Submitting...',
      },
      vacationWidget: {
        title: 'Vacation',
        titleWithYear: 'Vacation {year}',
        totalDays: 'total days',
        daysAvailable: 'Days Available',
        daysUsed: 'Used',
        daysPending: 'Pending',
        daysFree: 'Available',
        used: 'Used',
        pending: 'Pending',
        remaining: 'Remaining',
        noInfo: 'No vacation information available',
        loading: 'Loading vacation days...',
      },
    },

    // Image Cropper
    imageCropper: {
      title: 'Crop profile image',
      dragToAdjust: 'Drag to adjust the crop area (will be circular)',
      processing: 'Processing...',
    },

    // Jobs & Vacancies
    jobs: {
      application: {
        submit: 'Submit Application',
        sending: 'Sending...',
      },
    },

    // Notifications
    notifications: {
      preferencesSaved: 'Your notification preferences have been updated',
      markAllAsRead: 'Mark all as read',
      closeNotifications: 'Close notifications',
      moreActions: 'More notification actions',
      
      // NotificationSettings component
      channels: {
        title: 'Notification channels',
        email: 'Email',
        sms: 'SMS',
        whatsapp: 'WhatsApp',
        verified: 'Verified',
      },
      types: {
        title: 'Preferences by type',
        appointmentReminder: 'Appointment reminders',
        appointmentConfirmation: 'Appointment confirmations',
        appointmentCancellation: 'Cancellations',
        appointmentRescheduled: 'Rescheduling',
        securityAlert: 'Security alerts',
      },
      doNotDisturb: {
        title: 'Do not disturb',
        from: 'From',
        until: 'Until',
      },
      summaries: {
        title: 'Summaries',
        dailyDigest: 'Daily digest',
        weeklyDigest: 'Weekly digest',
        sendTime: 'Send time',
        sendDay: 'Send day',
      },
      days: {
        sunday: 'Sunday',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
      },
      errors: {
        loadError: 'Could not load preferences',
        noPreferences: 'Could not load preferences',
      },
    },

    // User Profile
    userProfile: {
      tabs: {
        services: 'Services',
        experience: 'Experience',
        reviews: 'Reviews',
      },
      header: {
        completedAppointments: 'completed appointments',
        verifiedProfessional: 'Verified professional',
      },
      services: {
        title: 'Services',
        noServices: 'No services available',
        schedule: 'Schedule',
      },
      experience: {
        title: 'Experience',
        businessesTitle: 'Businesses where they work',
        independentProfessional: 'Independent professional',
        aboutMe: 'About me',
        statistics: 'Statistics',
        stats: {
          completedAppointments: 'Completed appointments',
          rating: 'Rating',
          services: 'Services',
        },
      },
      reviews: {
        title: 'Reviews',
        leaveReview: 'Leave review',
      },
      footer: {
        scheduleWith: 'Schedule Appointment with {name}',
        notAvailable: 'Professional not available',
        notLinkedMessage: 'This professional is not linked to any active business',
      },
      errors: {
        loadError: 'Could not load professional information',
        submitReviewError: 'Could not send review at this time',
      },
      actions: {
        close: 'Close',
      },
    },

    // Tax Configuration
    taxConfiguration: {
      title: 'Tax Configuration',
      subtitle: 'Configure taxes and tax obligations for your business',
      resetSuccess: 'Configuration reset',
      tabs: {
        general: 'General',
        iva: 'VAT',
        ica: 'ICA',
        retention: 'Retention',
      },
      general: {
        taxRegime: 'Tax Regime',
        taxRegimeDescription: 'Common regime charges VAT, simplified generally does not',
        taxId: 'Tax ID Number (NIT)',
        taxIdPlaceholder: '900123456-7',
        taxIdDescription: 'Include verification digit',
        city: 'City (for ICA)',
        cityDescription: 'Each city has a different ICA rate',
        regimes: {
          common: 'Common Regime',
          simple: 'Simplified Regime',
          special: 'Special Regime',
        },
      },
      iva: {
        title: 'VAT',
        enable: 'Charge VAT',
        description: 'Value Added Tax',
        rate: 'VAT Rate (%)',
        rateDescription: '19% is the general rate in Colombia',
        rates: {
          exempt: '0% (Exempt)',
          basic: '5% (Basic products)',
          general: '19% (General)',
        },
        infoNote: 'VAT is calculated on the subtotal of each transaction. Products may have different rates (0%, 5%, 19%).',
      },
      ica: {
        title: 'ICA',
        enable: 'Charge ICA',
        description: 'Industry and Commerce Tax',
        rate: 'ICA Rate',
        rateCalculated: '(calculated by city)',
        selectCityHint: 'Select city in General tab to update rate',
        cityRates: 'ICA by city:',
      },
      retention: {
        title: 'Retention',
        enable: 'Apply Withholding Tax',
        description: 'For large taxpayers',
        activityType: 'Activity Type',
        rate: 'Retention Rate',
        rateDescription: 'Automatic rate based on selected activity type',
        infoNote: 'Withholding tax is deducted from the amount to be paid to the supplier and must be declared monthly to DIAN.',
      },
      summary: {
        title: 'Configuration Summary',
        regime: 'Regime:',
        taxId: 'Tax ID:',
        city: 'City:',
        notConfigured: 'Not configured',
        notSelected: 'Not selected',
        active: 'Active',
        inactive: 'Inactive',
      },
      alerts: {
        simpleRegimeTitle: 'Simplified Regime',
        simpleRegimeDescription: 'In simplified regime, VAT is not charged. ICA may apply depending on the city.',
      },
    },

    // Admin Dashboard
    adminDashboard: {
      sidebar: {
        overview: 'Overview',
        appointments: 'Appointments',
        absences: 'Absences',
        locations: 'Locations',
        services: 'Services',
        resources: 'Resources',
        employees: 'Employees',
        recruitment: 'Recruitment',
        quickSales: 'Quick Sales',
        accounting: 'Accounting',
        reports: 'Reports',
        billing: 'Billing',
        permissions: 'Permissions',
      },
    },

    // Employee Dashboard
    employeeDashboard: {
      sidebar: {
        myEmployments: 'My Jobs',
        searchVacancies: 'Search Vacancies',
        myAbsences: 'My Absences',
        myAppointments: 'My Appointments',
        schedule: 'Schedule',
      },
    },

    // Client Dashboard
    clientDashboard: {
      upcomingTitle: 'Upcoming Appointments',
      viewAll: 'View All',
      noUpcoming: 'No upcoming appointments',
      bookFirstAppointment: 'Book your first appointment to get started',
      bookAppointment: 'Book Appointment',
      pastTitle: 'Past Appointments',
      confirmButton: 'Confirm',
      alreadyConfirmed: 'Already confirmed',
      addToCalendar: 'Add to Google Calendar',
      deleteAppointment: 'Delete appointment',
      rebook: 'Rebook',
      appointment: 'Appointment',
      with: 'with',
      confirmDelete: 'Are you sure you want to delete this appointment?',
      deleteSuccess: 'Appointment deleted successfully',
      deleteError: 'Error deleting appointment',
      errorDeleting: 'Error deleting: {message}',
      status: {
        confirmed: 'Confirmed',
        pending: 'Pending',
        completed: 'Completed',
        cancelled: 'Cancelled',
        scheduled: 'Scheduled',
        inProgress: 'In Progress',
        noShow: 'No Show',
      },
      table: {
        service: 'Service',
        dateTime: 'Date & Time',
        provider: 'Provider',
        location: 'Location',
        actions: 'Actions',
      },
    },

    // Favorites List
    favoritesList: {
      loading: 'Loading your favorite businesses...',
      errorTitle: 'Error loading favorites',
      emptyTitle: 'No favorites yet',
      emptyDescription: 'Mark your preferred businesses as favorites to access them quickly and book appointments more easily.',
      tipHeader: 'Tip: Search for a business and click the heart icon to add it to favorites',
      bookButton: 'Book Appointment',
      myFavorites: 'My Favorites',
      businessMarked: 'business marked as favorite',
      businessesMarked: 'businesses marked as favorites',
      tipDescription: 'Click on any card to see the complete business profile, its services, locations and reviews. From there you can easily book appointments.',
      removeFavorite: 'Remove from favorites',
      removedSuccess: 'Business removed from favorites',
      removedError: 'Error removing from favorites',
    },

    // City Selector
    citySelector: {
      selectRegion: 'Select Region',
      loading: 'Loading...',
      noRegions: 'No regions available',
      retry: 'Retry',
      allCities: 'All cities',
      loadingCities: 'Loading cities...',
    },

    // Business Selector
    businessSelector: {
      selectBusiness: 'Select Business',
    },

    // Theme Toggle
    themeToggle: {
      label: 'Toggle theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },

    // Role Selector
    roleSelector: {
      label: 'Change Role',
      admin: 'Administrator',
      employee: 'Employee',
      client: 'Client',
      selectRole: 'Select a role',
      createBusiness: 'Create business',
      joinBusiness: 'Join business',
      bookServices: 'Book services',
    },

    // Service Status Badge
    serviceStatusBadge: {
      active: 'Active',
      inactive: 'Inactive',
    },

    // Language Toggle
    languageToggle: {
      label: 'Language',
      spanish: 'Español',
      english: 'English',
    },

    // Owner Badge
    ownerBadge: {
      owner: 'Owner',
      admin: 'Admin',
    },

    // Business Invitation Card
    businessInvitationCard: {
      copied: 'Code copied to clipboard',
      qrGenerated: 'QR Code generated',
      qrError: 'Error generating QR code',
      qrDownloaded: 'QR Code downloaded',
      shareSuccess: 'Shared successfully',
      shareError: 'Error sharing',
      copyCode: 'Copy Code',
      generateQR: 'Generate QR',
      downloadQR: 'Download QR',
      share: 'Share Invitation',
    },

    // Quick Sale Form
    quickSaleForm: {
      title: 'Quick Sale',
      subtitle: 'Register a quick walk-in sale',
      clientNameLabel: 'Client Name',
      clientPhoneLabel: 'Phone',
      clientDocumentLabel: 'Document',
      clientEmailLabel: 'Email',
      serviceLabel: 'Service',
      locationLabel: 'Location',
      employeeLabel: 'Employee (Optional)',
      paymentMethodLabel: 'Payment Method',
      amountLabel: 'Amount',
      notesLabel: 'Notes',
      cash: 'Cash',
      card: 'Card',
      transfer: 'Transfer',
      clientNameRequired: 'Client name is required',
      selectService: 'Select a service',
      selectLocation: 'Select a location',
      enterAmount: 'Enter a valid amount',
      selectPaymentMethod: 'Select a payment method',
      register: 'Register Sale',
      loading: 'Loading...',
      error: 'Error loading data',
      errorRegistering: 'Error registering sale',
      successRegistering: 'Sale registered successfully',
      cancel: 'Cancel',
    },

    // Review Form
    reviewForm: {
      title: 'Leave a Review',
      subtitle: 'Share your experience',
      ratingLabel: 'Rating',
      commentLabel: 'Comment',
      submitButton: 'Submit Review',
      cancelButton: 'Cancel',
      selectRating: 'Select a rating',
      loading: 'Submitting...',
      successSubmit: 'Thank you for your review!',
      errorSubmit: 'Error submitting review',
    },

    // Review Card
    reviewCard: {
      anonymous: 'Anonymous',
      rating: 'Rating',
      verified: 'Verified Purchase',
      helpful: 'Helpful',
      notHelpful: 'Not Helpful',
      report: 'Report',
      loading: 'Loading...',
    },

    // Review List
    reviewList: {
      noReviews: 'No reviews yet',
      loading: 'Loading reviews...',
      error: 'Error loading reviews',
      sortBy: 'Sort by',
      recent: 'Recent',
      highest: 'Highest Rating',
      lowest: 'Lowest Rating',
      mostHelpful: 'Most Helpful',
    },

    // Profile Page
    profilePage: {
      title: 'My Profile',
      editProfile: 'Edit Profile',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      successUpdate: 'Profile updated successfully',
      errorUpdate: 'Error updating profile',
    },

    // Recommended Businesses
    recommendedBusinesses: {
      title: 'Recommended for You',
      noRecommendations: 'No recommendations available',
      loading: 'Loading recommendations...',
    },

    // Business Suggestions
    businessSuggestions: {
      title: 'Popular Businesses',
      titleWithCity: 'Businesses in {city}',
      frequentTitle: 'Your Frequent Businesses',
      recommendedTitle: 'Recommended in your city',
      singleVisit: '1 completed appointment',
      multiVisit: '{count} completed appointments',
      lastVisit: 'Last visit: {date}',
      genericDescription: 'Recommended business',
      noSuggestions: 'No suggestions available',
      loading: 'Loading suggestions...',
      viewMore: 'View More',
      basedOnReviews: 'Based on your reviews',
      inCity: 'In',
      bookNow: 'Book Now',
      bookAgain: 'Book Again',
    },

    // Dashboard Overview
    dashboardOverview: {
      title: 'Dashboard',
      welcomeBack: 'Welcome back',
      upcoming: 'Upcoming',
      noUpcoming: 'No upcoming appointments',
      recent: 'Recent Activity',
      noActivity: 'No recent activity',
      viewMore: 'View More',
    },

    // Cookie Consent
    cookieConsent: {
      title: 'We use cookies to improve your experience',
      description: 'This site uses analytics cookies to understand how you interact with our platform. We do not share your data with third parties and respect your privacy.',
      reject: 'Reject',
      accept: 'Accept cookies',
      close: 'Close',
    },
  },

  es: {
    // Landing Page
    landing: {
      nav: {
        features: 'Características',
        benefits: 'Beneficios',
        pricing: 'Planes',
        testimonials: 'Testimonios',
        signIn: 'Iniciar Sesión',
        getStarted: 'Comenzar Gratis'
      },
      hero: {
        badge: 'Diseñado para PyMES Colombianas',
        title: 'Gestiona tu negocio en',
        titleHighlight: 'piloto automático',
        subtitle: 'La plataforma TODO-EN-UNO para gestionar citas, clientes, empleados, contabilidad y más. Ahorra tiempo, aumenta ingresos y crece sin límites.',
        cta: {
          trial: 'Prueba 30 Días GRATIS',
          pricing: 'Ver Planes y Precios',
          noCreditCard: 'Sin tarjeta de crédito',
          cancelAnytime: 'Cancela cuando quieras'
        },
        stats: {
          businesses: 'Negocios Activos',
          appointments: 'Citas Agendadas',
          satisfaction: 'Satisfacción'
        }
      },
      dashboard: {
        title: 'Dashboard',
        today: 'Hoy',
        appointments: 'Citas Hoy',
        revenue: 'Ingresos Mes',
        upcoming: 'Próximas Citas',
        client: 'Cliente',
        haircut: 'Corte de cabello',
        confirmed: 'Confirmada',
        secureData: 'Datos seguros y encriptados'
      },
      features: {
        badge: 'Funcionalidades',
        title: 'Todo lo que necesitas en una sola plataforma',
        subtitle: 'Deja de usar 5 herramientas diferentes. Gestabiz lo tiene TODO.',
        list: {
          appointments: {
            title: 'Gestión de Citas',
            description: 'Calendario inteligente con prevención de conflictos y sincronización con Google Calendar.'
          },
          reminders: {
            title: 'Recordatorios Automáticos',
            description: 'WhatsApp, Email y SMS. Reduce no-shows en un 70%. Tus clientes nunca olvidan.'
          },
          clients: {
            title: 'Gestión de Clientes',
            description: 'Base de datos completa con historial, notas y análisis de clientes recurrentes.'
          },
          accounting: {
            title: 'Sistema Contable',
            description: 'IVA, ICA, Retención. Reportes P&L automáticos. Preparado para DIAN Colombia.'
          },
          mobile: {
            title: 'App Móvil Nativa',
            description: 'iOS y Android. Gestiona tu negocio desde cualquier lugar, en cualquier momento.'
          },
          jobs: {
            title: 'Portal de Empleos',
            description: 'Publica vacantes, gestiona aplicaciones y encuentra el talento que necesitas.'
          },
          analytics: {
            title: 'Analytics Avanzados',
            description: 'Dashboards interactivos, gráficos en tiempo real y reportes exportables.'
          },
          automation: {
            title: 'Automatizaciones',
            description: 'Confirmaciones, recordatorios, facturas. Todo automático mientras duermes.'
          },
          security: {
            title: 'Seguridad Total',
            description: 'Encriptación de datos, backups automáticos y cumplimiento de privacidad.'
          }
        }
      },
      benefits: {
        badge: 'Beneficios Reales',
        title: 'Recupera hasta $1.5M pesos mensuales en citas perdidas',
        subtitle: 'No es magia, son datos. Nuestros clientes recuperan en promedio 70% de las citas que antes se perdían por olvidos o cancelaciones.',
        stats: {
          noShows: {
            value: '70%',
            label: 'Reducción de No-Shows',
            description: 'Los recordatorios automáticos funcionan'
          },
          timeSaved: {
            value: '8-12h',
            label: 'Tiempo Ahorrado Semanal',
            description: 'Ya no pierdes tiempo agendando manualmente'
          },
          bookings: {
            value: '35%',
            label: 'Aumento en Reservas',
            description: 'Tus clientes agendan 24/7, incluso cuando duermes'
          },
          roi: {
            value: '900%',
            label: 'ROI Promedio',
            description: 'La inversión se paga sola en el primer mes'
          }
        },
        cta: 'Empieza a Recuperar Dinero Hoy',
        calculator: {
          lost: 'Dinero Perdido Mensual',
          lostDescription: 'Si pierdes 25 citas/mes a $50.000 cada una',
          withGestabiz: 'Con Gestabiz',
          recovered: 'Recuperas',
          appointmentsRecovered: 'Citas recuperadas (70%)',
          cost: 'Costo de AppointSync',
          netProfit: 'Ganancia Neta',
          paysSelf: '🎉 La inversión se paga SOLA en el primer mes'
        }
      },
      pricing: {
        badge: 'Planes y Precios',
        title: 'Precios transparentes. Sin sorpresas.',
        subtitle: 'Más barato que la competencia. Más funcionalidades. Precio justo para tu negocio.'
      },
      testimonials: {
        badge: 'Testimonios',
        title: 'Lo que dicen nuestros clientes',
        subtitle: 'Más de 800 negocios en Colombia confían en Gestabiz',
        list: {
          maria: {
            name: 'María González',
            business: 'Salón Glamour - Medellín',
            text: 'No puedo creer que no empecé antes. Mis clientas dicen que se ve súper profesional y yo estoy mucho más tranquila. Recuperé $720.000/mes en citas perdidas.',
            stat: '900% ROI'
          },
          carlos: {
            name: 'Dr. Carlos Ramírez',
            business: 'Consultorio Dental SmileCare - Bogotá',
            text: 'Como médico, mi tiempo vale oro. AppointSync me devolvió 10 horas a la semana. Ahora atiendo más pacientes y mi contador está feliz.',
            stat: '800% ROI'
          },
          juan: {
            name: 'Juan Martínez',
            business: 'Personal Trainer - Cali',
            text: 'Invertí $29.900 y me cambió la vida. Ahora parezco un negocio profesional. Incluso subí mis precios. Mejor inversión que he hecho.',
            stat: '2000% ROI'
          }
        }
      },
      cta: {
        title: '¿Listo para transformar tu negocio?',
        subtitle: 'Únete a más de 800 negocios que ya están ahorrando tiempo y aumentando ingresos con Gestabiz.',
        buttons: {
          trial: 'Empieza GRATIS por 30 Días',
          login: 'Ya tengo cuenta'
        },
        benefits: {
          noCreditCard: 'Sin tarjeta de crédito',
          cancelAnytime: 'Cancela cuando quieras',
          spanishSupport: 'Soporte en español'
        }
      },
      footer: {
        tagline: 'La plataforma #1 de gestión empresarial para PyMES colombianas.',
        product: {
          title: 'Producto',
          features: 'Características',
          pricing: 'Precios',
          integrations: 'Integraciones',
          api: 'API'
        },
        resources: {
          title: 'Recursos',
          blog: 'Blog',
          help: 'Ayuda',
          tutorials: 'Tutoriales',
          contact: 'Contacto'
        },
        legal: {
          title: 'Legal',
          terms: 'Términos',
          privacy: 'Privacidad',
          cookies: 'Cookies',
          licenses: 'Licencias'
        },
        copyright: '© 2025 Gestabiz. Todos los derechos reservados.',
        madeIn: 'Hecho con ❤️ en Colombia 🇨🇴'
      }
    },

    // Common - Traducciones comunes usadas en múltiples componentes
    common: {
      // Actions
      actions: {
        save: 'Guardar',
        saving: 'Guardando...',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        deleting: 'Eliminando...',
        create: 'Crear',
        creating: 'Creando...',
        update: 'Actualizar',
        updating: 'Actualizando...',
        confirm: 'Confirmar',
        edit: 'Editar',
        view: 'Ver',
        close: 'Cerrar',
        back: 'Volver',
        next: 'Siguiente',
        previous: 'Anterior',
        submit: 'Enviar',
        search: 'Buscar',
        filter: 'Filtrar',
        reset: 'Restablecer',
        apply: 'Aplicar',
        download: 'Descargar',
        upload: 'Subir',
        select: 'Seleccionar',
        deselect: 'Deseleccionar',
        selectAll: 'Seleccionar todo',
        deselectAll: 'Deseleccionar todo',
        continue: 'Continuar',
        finish: 'Finalizar',
        add: 'Agregar',
        remove: 'Eliminar',
        send: 'Enviar',
        receive: 'Recibir',
        accept: 'Aceptar',
        reject: 'Rechazar',
        approve: 'Aprobar',
        decline: 'Rechazar',
        enable: 'Habilitar',
        disable: 'Deshabilitar',
        activate: 'Activar',
        deactivate: 'Desactivar',
        refresh: 'Actualizar',
        reload: 'Recargar',
        retry: 'Reintentar',
        copy: 'Copiar',
        paste: 'Pegar',
        duplicate: 'Duplicar',
        share: 'Compartir',
        export: 'Exportar',
        import: 'Importar',
        print: 'Imprimir',
      },
      // States
      states: {
        loading: 'Cargando...',
        saved: 'Guardado',
        deleted: 'Eliminado',
        created: 'Creado',
        updated: 'Actualizado',
        error: 'Error',
        success: 'Éxito',
        warning: 'Advertencia',
        info: 'Información',
        pending: 'Pendiente',
        processing: 'Procesando...',
        completed: 'Completado',
        failed: 'Fallido',
        active: 'Activo',
        inactive: 'Inactivo',
        enabled: 'Habilitado',
        disabled: 'Deshabilitado',
      },
      // Messages
      messages: {
        confirmDelete: '¿Estás seguro de que deseas eliminar esto?',
        confirmCancel: '¿Estás seguro de que deseas cancelar?',
        unsavedChanges: 'Tienes cambios sin guardar. ¿Deseas continuar?',
        saveSuccess: 'Guardado exitosamente',
        saveError: 'Error al guardar',
        deleteSuccess: 'Eliminado exitosamente',
        deleteError: 'Error al eliminar',
        createSuccess: 'Creado exitosamente',
        createError: 'Error al crear',
        updateSuccess: 'Actualizado exitosamente',
        updateError: 'Error al actualizar',
        loadError: 'Error al cargar los datos',
        requiredFields: 'Por favor completa todos los campos requeridos',
        invalidEmail: 'Por favor ingresa un email válido',
        invalidPhone: 'Por favor ingresa un teléfono válido',
        passwordMismatch: 'Las contraseñas no coinciden',
        noResults: 'No se encontraron resultados',
        noData: 'No hay datos disponibles',
        tryAgain: 'Por favor intenta nuevamente',
        sessionExpired: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente',
        unauthorized: 'No tienes permisos para realizar esta acción',
        notFound: 'No encontrado',
        serverError: 'Error del servidor. Por favor intenta más tarde',
        networkError: 'Error de conexión. Verifica tu internet',
      },
      // Forms
      forms: {
        required: 'Requerido',
        optional: 'Opcional',
        pleaseSelect: 'Por favor selecciona',
        selectOption: 'Selecciona una opción',
        enterValue: 'Ingresa un valor',
        chooseFile: 'Elegir archivo',
        noFileSelected: 'No se seleccionó ningún archivo',
        dragDropFiles: 'Arrastra archivos aquí o haz clic para seleccionar',
      },
      // Placeholders
      placeholders: {
        businessName: 'Nombre de tu negocio',
        businessDescription: 'Describe tu negocio',
        phoneNumber: 'Número de teléfono',
        email: 'contacto@negocio.com',
        website: 'https://www.tunegocio.com',
        address: 'Calle y número',
        city: 'Ciudad',
        state: 'Estado',
        legalName: 'Razón social o nombre legal',
        taxId: 'Número de identificación fiscal',
        selectLocation: 'Selecciona una ubicación',
        selectService: 'Selecciona el servicio prestado',
        selectEmployee: 'Selecciona un empleado',
        selectCity: 'Seleccione una ciudad',
        selectActivityType: 'Seleccione tipo de actividad',
        selectDate: 'Selecciona una fecha',
        selectType: 'Selecciona un tipo',
        jobTitle: 'Ej: Estilista Profesional',
        jobDescription: 'Describe el puesto y las funciones principales',
        jobRequirements: 'Lista los requisitos necesarios para el puesto',
        jobResponsibilities: 'Describe las responsabilidades del puesto',
        jobBenefits: 'Describe los beneficios que ofreces',
        clientName: 'Ej: Juan Pérez',
        clientPhone: 'Ej: 3001234567',
        clientDocument: 'Ej: 1234567890',
        clientEmail: 'Ej: cliente@example.com',
        amount: 'Ej: 50000',
        selectPaymentMethod: 'Selecciona método',
        notes: 'Ej: Cliente frecuente, descuento aplicado...',
        transactionDetails: 'Detalles adicionales de la transacción...',
        applicationLetter: 'Cuéntanos por qué eres el candidato ideal para este puesto...',
        availabilityNotes: 'Proporciona detalles adicionales sobre tu solicitud...',
        portfolio: 'https://tu-portafolio.com',
        linkedin: 'https://linkedin.com/in/tu-perfil',
        github: 'https://github.com/tu-usuario',
        bio: 'Describe tu experiencia, habilidades y qué te hace único como profesional...',
        skills: 'Ej: Desarrollo Web, Marketing Digital...',
        languages: 'Ej: Español, Inglés...',
        certificationName: 'Nombre de la certificación *',
        certificationIssuer: 'Emisor *',
        certificationIssueDate: 'Fecha de emisión *',
        certificationExpiryDate: 'Fecha de expiración',
        certificationId: 'ID de credencial',
        certificationUrl: 'URL de credencial',
        searchCountry: 'Buscar país...',
        searchCity: 'Buscar ciudad...',
        searchEPS: 'Buscar EPS...',
        searchPrefix: 'Buscar prefijo...',
        deactivateAccount: 'DESACTIVAR CUENTA',
        rejectionReason: 'Razón de la decisión...',
        internalNotes: 'Notas internas...',
        allLocations: 'Todas las sedes',
        allEmployees: 'Todos los empleados',
        allCategories: 'Todas las categorías',
        selectDepartmentFirst: 'Primero seleccione un departamento',
        sortBy: 'Ordenar por',
        priceRange: 'Rango de precio',
        status: 'Estado',
        titleOrDescription: 'Título o descripción',
        expiryDate: 'Fecha de vencimiento',
        credentialId: 'ID de credencial',
        credentialUrl: 'URL de credencial',
        selectDepartment: 'Seleccione un departamento',
        all: 'Todos',
        allStatuses: 'Todos los estados',
        allVacancies: 'Todas las vacantes',
        selectCategory: 'Selecciona una categoría',
        selectBusiness: 'Selecciona un negocio',
        period: 'Período',
      },
      // Validation messages
      validation: {
        selectRequestType: 'Selecciona un tipo de solicitud',
        selectStartDate: 'Selecciona la fecha de inicio',
        selectEndDate: 'Selecciona la fecha de fin',
        requestTooLong: 'La solicitud no puede exceder 365 días',
        selectType: 'Selecciona un tipo',
        selectDate: 'Selecciona una fecha',
      },
      // Service Status
      serviceStatus: {
        connectionStatus: 'Estado de la Conexión',
        platform: 'Plataforma',
        authentication: 'Inicio de Sesión',
        database: 'Datos',
        storage: 'Archivos',
        verifyAgain: 'Verificar de nuevo',
        lastCheck: 'Última verificación',
        connectionError: 'No pudimos conectarnos a la plataforma. Por favor intenta de nuevo en unos minutos.',
        persistentIssue: 'Si el problema persiste, contáctanos',
      },
      // Time & Date
      time: {
        today: 'Hoy',
        yesterday: 'Ayer',
        tomorrow: 'Mañana',
        thisWeek: 'Esta semana',
        lastWeek: 'Semana pasada',
        nextWeek: 'Próxima semana',
        thisMonth: 'Este mes',
        lastMonth: 'Mes pasado',
        nextMonth: 'Próximo mes',
        am: 'AM',
        pm: 'PM',
        hour: 'hora',
        hours: 'horas',
        minute: 'minuto',
        minutes: 'minutos',
        day: 'día',
        days: 'días',
        week: 'semana',
        weeks: 'semanas',
        month: 'mes',
        months: 'meses',
        year: 'año',
        years: 'años',
        // Days of the week
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo',
      },
      // Misc
      misc: {
        yes: 'Sí',
        no: 'No',
        ok: 'OK',
        all: 'Todos',
        none: 'Ninguno',
        other: 'Otro',
        more: 'Más',
        less: 'Menos',
        show: 'Mostrar',
        hide: 'Ocultar',
        expand: 'Expandir',
        collapse: 'Contraer',
        total: 'Total',
        subtotal: 'Subtotal',
        of: 'de',
        page: 'Página',
        perPage: 'por página',
        results: 'resultados',
        showing: 'Mostrando',
        to: 'a',
        from: 'desde',
        until: 'hasta',
      },
    },

    // Image Cropper
    imageCropper: {
      title: 'Recortar imagen de perfil',
      dragToAdjust: 'Arrastra para ajustar el área de recorte (será circular)',
      processing: 'Procesando...',
    },

    // Jobs & Vacancies
    jobs: {
      application: {
        submit: 'Enviar Aplicación',
        sending: 'Enviando...',
      },
    },

    // Notifications
    notifications: {
      preferencesSaved: 'Tus preferencias de notificación han sido actualizadas',
      markAllAsRead: 'Marcar todas como leídas',
      closeNotifications: 'Cerrar notificaciones',
      moreActions: 'Más acciones de notificación',
      
      // NotificationSettings component
      channels: {
        title: 'Canales de notificación',
        email: 'Email',
        sms: 'SMS',
        whatsapp: 'WhatsApp',
        verified: 'Verificado',
      },
      types: {
        title: 'Preferencias por tipo',
        appointmentReminder: 'Recordatorios de citas',
        appointmentConfirmation: 'Confirmaciones de citas',
        appointmentCancellation: 'Cancelaciones',
        appointmentRescheduled: 'Reagendamientos',
        securityAlert: 'Alertas de seguridad',
      },
      doNotDisturb: {
        title: 'No molestar',
        from: 'Desde',
        until: 'Hasta',
      },
      summaries: {
        title: 'Resúmenes',
        dailyDigest: 'Resumen diario',
        weeklyDigest: 'Resumen semanal',
        sendTime: 'Hora de envío',
        sendDay: 'Día de envío',
      },
      days: {
        sunday: 'Domingo',
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
      },
      errors: {
        loadError: 'No se pudieron cargar las preferencias',
        noPreferences: 'No se pudieron cargar las preferencias',
      },
    },

    // Validations
    validation: {
      startTimeRequired: 'La hora de inicio es requerida',
      futureTimeRequired: 'La hora de la cita debe ser en el futuro',
      serviceRequired: 'La selección de servicio es requerida',
      businessRequired: 'La selección de negocio es requerida',
      clientNameRequired: 'El nombre del cliente es requerido',
      dateRequired: 'La fecha es requerida',
      invalidTimeRange: 'Rango de tiempo inválido'
    },

    // Authentication
    auth: {
      login: 'Iniciar Sesión',
      logout: 'Cerrar Sesión',
      register: 'Registrarse',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      resetPassword: 'Restablecer Contraseña',
      loginWithGoogle: 'Continuar con Google',
      loginWithApple: 'Continuar con Apple',
      alreadyHaveAccount: '¿Ya tienes una cuenta?',
      dontHaveAccount: '¿No tienes una cuenta? ',
      signInHere: 'Inicia sesión aquí',
      signUpHere: 'Regístrate aquí',
      enterEmail: 'Ingresa tu correo electrónico',
      enterPassword: 'Ingresa tu contraseña',
      invalidCredentials: 'Credenciales inválidas',
      loginSuccess: 'Sesión iniciada exitosamente',
      registerSuccess: 'Cuenta creada exitosamente',
      logoutSuccess: 'Sesión cerrada exitosamente',
      welcomeMessage: 'Gestión profesional de citas para tu negocio',
      signIn: 'Iniciar Sesión',
      signUp: 'Registrarse',
      signInDescription: 'Ingresa tus credenciales para acceder a tu cuenta',
      signUpDescription: 'Crea una nueva cuenta para comenzar',
      name: 'Nombre Completo',
      emailPlaceholder: 'Ingresa tu dirección de correo',
      passwordPlaceholder: 'Ingresa tu contraseña',
      namePlaceholder: 'Ingresa tu nombre completo',
      confirmPasswordPlaceholder: 'Confirma tu contraseña',
      signingIn: 'Iniciando sesión...',
      creatingAccount: 'Creando cuenta...',
      continueWithGoogle: 'Continuar con Google',
      orContinueWith: 'O continuar con',
      fillAllFields: 'Por favor completa todos los campos',
      passwordsDontMatch: 'Las contraseñas no coinciden',
      passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
      loginSuccessful: 'Inicio de sesión exitoso',
      registrationSuccessful: 'Registro exitoso',
      checkEmailVerification: 'Por favor revisa tu correo para la verificación',
      loginError: 'Error en el inicio de sesión',
      registrationError: 'Error en el registro',
      redirectingToGoogle: 'Redirigiendo a Google...',
      googleLoginError: 'Error en el login de Google',
      enterEmailFirst: 'Por favor ingresa tu correo primero',
      passwordResetSent: 'Correo de restablecimiento enviado',
      passwordResetError: 'Error al restablecer contraseña',
      termsAgreement: 'Al continuar, aceptas nuestros',
      termsOfService: 'Términos de Servicio',
      and: 'y',
      privacyPolicy: 'Política de Privacidad',
      or: 'o',
      loginAsDemo: 'Iniciar Sesión como Demo',
      continueBooking: 'Inicia sesión para continuar con tu reserva',
      accountInactive: 'Tu cuenta está inactiva. No podrás iniciar sesión hasta reactivar tu cuenta',
      mustSignIn: 'Debes iniciar sesión para crear una cita',
      rememberMe: 'Recuérdame'
    },

    // Email Verification Modal
    emailVerification: {
      title: 'Verifica tu correo electrónico',
      description: 'Hemos enviado un correo de verificación a:',
      verified: 'Ya verifiqué mi email',
      verifying: 'Verificando...',
      resend: 'Reenviar correo',
      resending: 'Reenviando...',
      step1: 'Revisa tu bandeja de entrada (y spam)',
      step2: 'Haz clic en el enlace de verificación',
      step3: 'Regresa aquí y haz clic en "Ya verifiqué mi email"',
      helpText: '¿No recibiste el correo? Verifica tu carpeta de spam o reenvía el correo.',
      resendSuccess: 'Correo de verificación reenviado',
      resendError: 'Error al reenviar el correo:',
      unexpectedError: 'Error inesperado al reenviar el correo',
      checkError: 'Error al verificar:',
      verifySuccess: '¡Email verificado exitosamente!',
      notVerified: 'El email aún no ha sido verificado. Por favor revisa tu bandeja de entrada.',
      verifyUnexpectedError: 'Error al verificar el estado del email',
    },

    // Account Inactive Modal
    accountInactive: {
      title: 'Cuenta Inactiva',
      message: 'Tu cuenta ha sido desactivada. ¿Deseas reactivarla ahora?',
      reactivate: 'Sí, reactivar',
      reactivating: 'Reactivando...',
      logout: 'No, cerrar sesión',
      infoText: 'Si reactivas tu cuenta podrás acceder inmediatamente.',
      reactivateError: 'Error al reactivar la cuenta',
      reactivateSuccess: 'Cuenta reactivada exitosamente',
      unexpectedError: 'Error inesperado al reactivar la cuenta',
    },

    // Navigation
    nav: {
      dashboard: 'Panel Principal',
      calendar: 'Calendario',
      appointments: 'Citas',
      clients: 'Clientes',
      services: 'Servicios',
      reports: 'Reportes',
      settings: 'Configuración',
      profile: 'Perfil',
      business: 'Negocio',
      employees: 'Empleados'
    },

    // Business Registration
    business: {
      management: {
        title: 'Gestión del Negocio',
        subtitle: 'Administra la información, sedes y servicios de tu negocio',
        configure_title: 'Configura tu negocio',
        configure_description: 'Primero configura la información básica de tu negocio',
        create_business: 'Crear Negocio',
        info_description: 'Información básica y de contacto de tu negocio',
        settings_title: 'Configuración del Negocio',
        settings_description: 'Ajustes generales para el funcionamiento de tu negocio',
        updated: 'Información del negocio actualizada'
      },
      registration: {
        title: 'Registra tu Negocio',
  business_description: 'Crea el perfil de tu negocio para comenzar a gestionar citas',
        basic_info: 'Información Básica',
        business_name: 'Nombre del Negocio',
        category: 'Categoría',
        description: 'Descripción',
        contact_info: 'Información de Contacto',
        phone: 'Teléfono',
        email: 'Correo Electrónico',
        website: 'Sitio Web',
        location: 'Ubicación',
        address: 'Dirección',
        city: 'Ciudad',
        country: 'País',
        postal_code: 'Código Postal',
        coordinates: 'Coordenadas',
        detect_location: 'Detectar Ubicación',
        location_detected: 'Ubicación detectada exitosamente',
        location_error: 'No se pudo detectar la ubicación',
        location_not_supported: 'La geolocalización no es compatible',
        business_hours: 'Horarios de Atención',
        open: 'Abierto',
        services: 'Servicios',
        add_service: 'Agregar Servicio',
        service: 'Servicio',
        remove: 'Eliminar',
        service_name: 'Nombre del Servicio',
        service_category: 'Categoría',
        service_description: 'Descripción',
        duration: 'Duración',
        minutes: 'minutos',
        price: 'Precio',
        create_business: 'Crear Negocio',
        creating: 'Creando...',
        success: 'Negocio creado exitosamente',
        error: 'Error al crear el negocio',
        validation: {
          required_fields: 'Por favor completa todos los campos requeridos',
          at_least_one_service: 'Por favor agrega al menos un servicio',
          clientNameRequired: 'El nombre del cliente es obligatorio'
        },
        placeholders: {
          business_name: 'Ingresa el nombre de tu negocio',
          category: 'Selecciona una categoría',
          description: 'Describe tu negocio',
          phone: '+57 300 123 4567',
          website: 'https://www.tunegocio.com',
          address: 'Dirección de la calle',
          city: 'Ciudad',
          country: 'País',
          postal_code: 'Código postal',
          latitude: 'Latitud',
          longitude: 'Longitud',
          service_name: 'ej. Corte de Cabello',
          service_category: 'ej. Servicios de Cabello',
          service_description: 'Breve descripción del servicio'
        },
        days: {
          monday: 'Lunes',
          tuesday: 'Martes',
          wednesday: 'Miércoles',
          thursday: 'Jueves',
          friday: 'Viernes',
          saturday: 'Sábado',
          sunday: 'Domingo'
        }
      },
      categories: {
        beauty_salon: 'Salón de Belleza',
        barbershop: 'Barbería',
        medical: 'Médico',
        dental: 'Dental',
        veterinary: 'Veterinaria',
        fitness: 'Fitness',
        consulting: 'Consultoría',
        automotive: 'Automotriz',
        education: 'Educación',
        legal: 'Legal',
        real_estate: 'Bienes Raíces',
        other: 'Otro'
      },
      hours: {
        closed: 'Cerrado'
      }
    },

    // Employee Management
    employee: {
      join: {
        title: 'Unirse a un Negocio',
        description: 'Busca y solicita unirte a un negocio como empleado',
        search_placeholder: 'Buscar por nombre, categoría o ciudad...',
        request_to_join: 'Solicitar Unirse',
        request_form_title: 'Solicitud de Unión',
        request_form_description: 'Enviar solicitud para unirse a {businessName}',
        message_label: 'Mensaje (Opcional)',
        message_placeholder: 'Cuéntale al dueño del negocio por qué quieres unirte a su equipo...',
        message_hint: 'Incluye tu experiencia y habilidades relevantes para este negocio',
        send_request: 'Enviar Solicitud',
        sending: 'Enviando...',
        request_sent_success: 'Solicitud enviada exitosamente',
        request_error: 'Error al enviar la solicitud',
        no_results_title: 'No se encontraron negocios',
        no_results_description: 'Intenta ajustar tus términos de búsqueda',
        no_businesses_title: 'No hay negocios disponibles',
        no_businesses_description: 'No hay negocios a los que puedas unirte en este momento'
      },
      requests: {
        pending_title: 'Solicitudes Pendientes',
        pending_description: 'Revisa y aprueba las solicitudes de empleados',
        processed_title: 'Solicitudes Procesadas',
        processed_description: 'Solicitudes revisadas anteriormente',
        approve: 'Aprobar',
        reject: 'Rechazar',
        requested_on: 'Solicitado el',
        processed_on: 'Procesado el',
        approved_success: 'Solicitud de empleado aprobada',
        rejected_success: 'Solicitud de empleado rechazada',
        error: 'Error al procesar la solicitud',
        no_requests_title: 'No hay solicitudes de empleados',
        no_requests_description: 'Cuando los usuarios soliciten unirse a tu negocio, aparecerán aquí',
        status: {
          pending: 'Pendiente',
          approved: 'Aprobado',
          rejected: 'Rechazado'
        }
      }
    },

    // Profile
    profile: {
      title: 'Perfil',
      personal_info: 'Información Personal',
      name: 'Nombre Completo',
  username: 'Usuario',
  username_hint: 'Solo letras, números, puntos y guiones bajos.',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      avatar: 'Foto de Perfil',
      upload_avatar: 'Subir Foto',
      change_avatar: 'Cambiar Foto',
      business_info: 'Información del Negocio',
      role: 'Rol',
      permissions: 'Permisos',
      joined_on: 'Se unió el',
      save_changes: 'Guardar Cambios',
      saving: 'Guardando...',
      success: 'Perfil actualizado exitosamente',
      error: 'Error al actualizar el perfil'
    },

    // Settings
    settings: {
      title: 'Configuración',
      subtitle: 'Configura tu cuenta y preferencias',
      profile: 'Perfil',
      appearance: 'Apariencia',
      theme: 'Tema',
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema',
      language: 'Idioma',
      spanish: 'Español',
      english: 'English',
      notifications: 'Notificaciones',
      email_notifications: 'Notificaciones por Email',
      push_notifications: 'Notificaciones Push',
      browser_notifications: 'Notificaciones del Navegador',
      whatsapp_notifications: 'Notificaciones de WhatsApp',
      reminder_24h: 'Recordatorios de 24 horas',
      reminder_1h: 'Recordatorios de 1 hora',
      reminder_15m: 'Recordatorios de 15 minutos',
      daily_digest: 'Resumen diario',
      weekly_report: 'Reporte semanal',
      save_preferences: 'Guardar Preferencias',
      preferences_saved: 'Preferencias guardadas exitosamente',
      // Tabs
      tabs: {
        general: 'Ajustes Generales',
        profile: 'Perfil',
        notifications: 'Notificaciones',
        businessPreferences: 'Preferencias del Negocio',
        employeePreferences: 'Preferencias de Empleado',
        clientPreferences: 'Preferencias de Cliente',
        dangerZone: 'Zona Peligrosa'
      },
      // Theme section
      themeSection: {
        title: 'Apariencia y Sistema',
        subtitle: 'Personaliza el tema y el idioma de la aplicación',
        themeLabel: 'Tema de la interfaz',
        themeDescription: 'Selecciona el tema que prefieres para la aplicación',
        themes: {
          light: {
            label: 'Claro',
            description: 'Interfaz con colores claros'
          },
          dark: {
            label: 'Oscuro',
            description: 'Interfaz con colores oscuros'
          },
          system: {
            label: 'Sistema',
            description: 'Según preferencias del sistema'
          }
        },
        currentTheme: 'Tema actual: {theme}',
        systemThemeNote: 'El tema cambia automáticamente según las preferencias de tu sistema operativo',
        changeAnytime: 'Puedes cambiar el tema en cualquier momento'
      },
      // Language section
      languageSection: {
        label: 'Idioma de la interfaz',
        description: 'Selecciona el idioma de la interfaz'
      },
      // Admin Business Preferences
      businessInfo: {
        title: 'Información del Negocio',
        subtitle: 'Información básica del negocio',
        tabs: {
          info: 'Información del Negocio',
          notifications: 'Notificaciones del Negocio',
          tracking: 'Historial'
        },
        basicInfo: {
          title: 'Información Básica',
          nameLabel: 'Nombre del Negocio *',
          namePlaceholder: 'Ingresa el nombre del negocio',
          descriptionLabel: 'Descripción',
          descriptionPlaceholder: 'Describe tu negocio...'
        },
        contactInfo: {
          title: 'Información de Contacto',
          phoneLabel: 'Teléfono',
          phonePlaceholder: 'Número de teléfono',
          emailLabel: 'Correo Electrónico',
          emailPlaceholder: 'contacto@negocio.com',
          websiteLabel: 'Sitio Web',
          websitePlaceholder: 'https://www.negocio.com'
        },
        addressInfo: {
          title: 'Dirección',
          addressLabel: 'Dirección',
          addressPlaceholder: 'Calle, número, barrio',
          cityLabel: 'Ciudad',
          cityPlaceholder: 'Ciudad',
          stateLabel: 'Departamento/Estado',
          statePlaceholder: 'Departamento o Estado'
        },
        legalInfo: {
          title: 'Información Legal',
          legalNameLabel: 'Razón Social',
          legalNamePlaceholder: 'Nombre legal del negocio',
          taxIdLabel: 'NIT / Identificación Tributaria',
          taxIdPlaceholder: 'Número de identificación tributaria'
        },
        operationSettings: {
          title: 'Configuraciones de Operación',
          allowOnlineBooking: 'Permitir reservas online',
          autoConfirm: 'Confirmación automática',
          autoReminders: 'Recordatorios automáticos',
          showPrices: 'Mostrar precios públicamente'
        },
        nameRequired: 'El nombre del negocio es requerido',
        saveSettings: 'Guardar Configuraciones'
      },
      // Employee Preferences
      employeePrefs: {
        title: 'Preferencias de Empleado',
        subtitle: 'Configura tus preferencias de trabajo',
        availability: {
          title: 'Disponibilidad',
          availableForAppointments: 'Disponible para nuevas citas',
          notifyNewAssignments: 'Notificar nuevas asignaciones',
          appointmentReminders: 'Recordatorios de citas'
        },
        schedule: {
          title: 'Mi horario de trabajo',
          workingDay: 'Día laboral',
          restDay: 'Día de descanso',
          startTime: 'Inicio',
          endTime: 'Fin',
          lunchBreak: 'Almuerzo',
          saveSchedule: 'Guardar Horarios'
        },
        messages: {
          title: 'Mensajes de Clientes',
          allowMessages: 'Permitir mensajes de clientes',
          description: 'Cuando esté activado, los clientes pueden enviarte mensajes directos'
        },
        professionalInfo: {
          title: 'Información Profesional',
          subtitle: 'Tu experiencia y tipo de trabajo preferido',
          summaryLabel: 'Resumen Profesional',
          summaryPlaceholder: 'Describe tu experiencia, habilidades y especialidades...',
          yearsExperienceLabel: 'Años de Experiencia',
          workTypeLabel: 'Tipo de Trabajo Preferido',
          workTypes: {
            fullTime: 'Tiempo Completo',
            partTime: 'Medio Tiempo',
            contract: 'Contrato',
            flexible: 'Flexible'
          }
        },
        salary: {
          title: 'Expectativas Salariales',
          minLabel: 'Salario Mínimo Esperado',
          maxLabel: 'Salario Máximo Esperado',
          minPlaceholder: 'Monto mínimo',
          maxPlaceholder: 'Monto máximo',
          invalidRange: 'El salario mínimo no puede ser mayor al máximo'
        },
        specializations: {
          title: 'Especializaciones',
          noSpecializations: 'No se han agregado especializaciones aún',
          newPlaceholder: 'Nueva especialización',
          addButton: 'Agregar'
        },
        languages: {
          title: 'Idiomas',
          noLanguages: 'No se han agregado idiomas aún',
          newPlaceholder: 'Idioma (ej: Inglés - Avanzado)',
          addButton: 'Agregar'
        },
        certifications: {
          title: 'Certificaciones y Licencias',
          noCertifications: 'No se han agregado certificaciones aún',
          addButton: 'Agregar Certificación',
          form: {
            nameLabel: 'Nombre de la Certificación',
            namePlaceholder: 'Nombre de la certificación o licencia',
            issuerLabel: 'Entidad Emisora',
            issuerPlaceholder: 'Entidad que emitió la certificación',
            dateLabel: 'Fecha de Obtención',
            datePlaceholder: 'MM/AAAA',
            urlLabel: 'URL de Credencial (opcional)',
            urlPlaceholder: 'https://...',
            cancelButton: 'Cancelar',
            saveButton: 'Guardar'
          },
          issued: 'Emitida',
          verifyCredential: 'Verificar credencial',
          deleteButton: 'Eliminar'
        },
        links: {
          title: 'Enlaces Profesionales',
          portfolioLabel: 'Portfolio / Sitio Web',
          portfolioPlaceholder: 'https://tu-portfolio.com',
          linkedinLabel: 'LinkedIn',
          linkedinPlaceholder: 'https://linkedin.com/in/tuperfil'
        },
        saveButton: 'Guardar Preferencias',
        resetButton: 'Restablecer'
      },
      // Client Preferences
      clientPrefs: {
        title: 'Preferencias de Cliente',
        subtitle: 'Configura tus preferencias de reserva',
        bookingPrefs: {
          title: 'Preferencias de Reserva',
          appointmentReminders: 'Recordatorios de citas',
          emailConfirmation: 'Confirmación por email',
          promotionNotifications: 'Notificaciones de promociones',
          savePaymentMethods: 'Guardar métodos de pago'
        },
        advanceTime: {
          title: 'Tiempo de Anticipación Preferido',
          label: 'Tiempo de aviso preferido para citas',
          options: {
            sameDay: 'El mismo día',
            oneDay: '1 día',
            twoDays: '2 días',
            threeDays: '3 días',
            oneWeek: '1 semana'
          }
        },
        serviceHistory: {
          title: 'Historial de Servicios',
          label: 'Guardar mi historial de servicios para recomendaciones',
          description: 'Usamos esto para sugerirte servicios similares'
        },
        paymentMethods: {
          title: 'Métodos de Pago',
          noneAdded: 'No se han agregado métodos de pago',
          types: {
            card: 'Tarjeta de Crédito/Débito',
            pse: 'PSE',
            cash: 'Efectivo',
            transfer: 'Transferencia bancaria'
          },
          addButton: 'Agregar Método de Pago'
        },
        savePreferences: 'Guardar Preferencias'
      },
      // Danger Zone
      dangerZone: {
        title: 'Zona Peligrosa',
        subtitle: 'Acciones irreversibles de cuenta',
        deactivate: {
          title: 'Desactivar Cuenta',
          description: 'Suspende temporalmente tu cuenta. Puedes reactivarla en cualquier momento.',
          button: 'Desactivar Cuenta',
          confirmTitle: '¿Estás seguro de que deseas desactivar tu cuenta?',
          confirmDescription: 'Tu cuenta será suspendida temporalmente. Todos tus datos se preservarán y podrás reactivarla en cualquier momento iniciando sesión nuevamente.',
          inputLabel: 'Confirma tu correo para continuar:',
          inputPlaceholder: 'tu@correo.com',
          checkbox: 'Entiendo que mi cuenta será suspendida temporalmente',
          cancel: 'Cancelar',
          confirm: 'Sí, desactivar mi cuenta'
        },
        delete: {
          title: 'Eliminar Cuenta',
          description: 'Elimina permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.',
          button: 'Eliminar Cuenta',
          confirmTitle: 'Eliminar cuenta permanentemente',
          warningTitle: 'Advertencia: Esta acción es irreversible',
          warningDescription: 'Estás a punto de eliminar permanentemente tu cuenta y todos los datos asociados. Esto incluye:',
          warningItems: {
            profile: 'Tu perfil e información personal',
            appointments: 'Todas tus citas (pasadas y futuras)',
            history: 'Tu historial completo de servicios',
            payments: 'Historial de pagos y métodos',
            preferences: 'Todas tus preferencias y configuraciones'
          },
          confirmText: 'Escribe "DESACTIVAR CUENTA" para confirmar',
          confirmPlaceholder: 'DESACTIVAR CUENTA',
          mustTypeCorrectly: 'Debes escribir "DESACTIVAR CUENTA" para confirmar',
          cancel: 'Cancelar',
          confirm: 'Sí, eliminar permanentemente',
          processing: 'Procesando...'
        }
      }
    },

    // Dashboard
    dashboard: {
      title: 'Panel Principal',
      welcome: '¡Bienvenido de vuelta, {name}!',
  overview: 'Esto es lo que está pasando con tu negocio hoy',
  overview_client: 'Aquí puedes ver el estado de tus citas. ¿Quieres agendar una nueva?',
  schedule_appointment: 'Agendar cita',
      quick_stats: 'Estadísticas Rápidas',
      recent_appointments: 'Citas Recientes',
      upcoming_appointments: 'Próximas Citas',
      total_appointments: 'Total de Citas',
      completed_appointments: 'Completadas',
      pending_appointments: 'Pendientes',
      cancelled_appointments: 'Canceladas',
      register_business: 'Registrar Negocio',
      join_business: 'Unirse a Negocio',
      no_business_title: 'No hay Negocio Registrado',
      no_business_description: 'Registra tu negocio o únete a uno existente para comenzar a gestionar citas',
      register_business_description: 'Crea el perfil de tu negocio y comienza a gestionar citas',
      join_business_description: 'Solicita unirte a un negocio existente como empleado',
      todayAppointments: 'Citas de Hoy',
      totalClients: 'Clientes Totales',
      monthlyRevenue: 'Ingresos Mensuales',
      upcomingToday: 'Próximas Hoy',
      quickActions: 'Acciones Rápidas',
      recentActivity: 'Actividad Reciente',
      comingSoon: 'Próximamente...',
      upcomingWeek: 'Próxima Semana',
      nextSevenDays: 'Próximos 7 Días',
      todaySchedule: 'Agenda de Hoy',
      noAppointmentsToday: 'No hay citas programadas para hoy',
      noUpcomingAppointments: 'No hay citas próximas',
      totalRevenue: 'Ingresos Totales',
      thisMonth: 'Este Mes',
      avgAppointmentValue: 'Valor Promedio por Cita',
      perAppointment: 'Por Cita',
      weeklyAppointments: 'Citas Semanales',
      appointmentStatus: 'Estado de Citas'
    },

    // Search
    search: {
      types: {
        services: 'Servicios',
        businesses: 'Negocios',
        categories: 'Categorías',
        users: 'Profesionales'
      },
      placeholders: {
        services: 'Buscar servicios...',
        businesses: 'Buscar negocios...',
        categories: 'Buscar categorías...',
        users: 'Buscar profesionales...'
      },
      results: {
        viewAll: 'Ver todos los resultados →',
        noResults: 'No se encontraron resultados',
        tryDifferent: 'Intenta con otros términos de búsqueda',
        independentService: 'Servicio independiente',
        noCategory: 'Sin categoría',
        locationNotSpecified: 'Ubicación no especificada',
        serviceCategory: 'Categoría de servicios',
        userNoName: 'Usuario sin nombre',
        independentProfessional: 'Profesional independiente',
        professionalServices: 'Profesional de servicios'
      },
      sorting: {
        relevance: 'Relevancia',
        balanced: 'Balanceado (Ubicación + Calificación)',
        distance: 'Más cercanos',
        rating: 'Mejor calificados',
        newest: 'Más nuevos',
        oldest: 'Más antiguos'
      },
      filters: {
        filters: 'Filtros',
        filter: 'Filtrar',
        active: 'Activos',
        enableLocation: 'Habilita la ubicación para ver distancias',
        enableLocationShort: 'Activa ubicación'
      },
      resultsPage: {
        title: 'Resultados de búsqueda',
        resultsFor: 'resultado para',
        resultsForPlural: 'resultados para',
        in: 'en',
        searching: 'Buscando resultados...',
        noResultsTitle: 'No se encontraron resultados',
        noResultsDescription: 'Intenta buscar con otros términos o cambia el tipo de búsqueda',
        typeLabels: {
          service: 'Servicio',
          business: 'Negocio',
          category: 'Categoría',
          user: 'Profesional'
        }
      }
    },

    // Appointments
    appointments: {
      title: 'Citas',
      new_appointment: 'Nueva Cita',
      edit_appointment: 'Editar Cita',
      create: 'Crear Cita',
      edit: 'Editar Cita',
      appointment_details: 'Detalles de la Cita',
      client_name: 'Nombre del Cliente',
      client_email: 'Email del Cliente',
      client_phone: 'Teléfono del Cliente',
      service: 'Servicio',
      selectService: 'Selecciona un servicio',
      employee: 'Empleado',
      date: 'Fecha',
      startTime: 'Hora de Inicio',
      endTime: 'Hora de Fin (Auto-calculada)',
      time: 'Hora',
      duration: 'Duración',
      price: 'Precio',
      notes: 'Notas',
      notesPlaceholder: 'Notas adicionales sobre la cita...',
      status: 'Estado',
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No Asistió',
      create_appointment: 'Crear Cita',
      update_appointment: 'Actualizar Cita',
      cancel_appointment: 'Cancelar Cita',
      complete_appointment: 'Completar Cita',
      delete_appointment: 'Eliminar Cita',
      appointment_created: 'Cita creada exitosamente',
      appointment_updated: 'Cita actualizada exitosamente',
      appointment_cancelled: 'Cita cancelada exitosamente',
      appointment_completed: 'Cita completada exitosamente',
      appointment_deleted: 'Cita eliminada exitosamente',
      no_appointments: 'No se encontraron citas',
      filter_by_status: 'Filtrar por estado',
      filter_by_date: 'Filtrar por fecha',
      all_statuses: 'Todos los estados',
      today: 'Hoy',
      this_week: 'Esta semana',
      this_month: 'Este mes',
      custom_range: 'Rango personalizado',
      // Errores del wizard
      wizard_errors: {
        professionalNotOffersService: 'Este profesional no ofrece el servicio seleccionado',
        cannotVerifyCompatibility: 'No se pudo verificar la compatibilidad del profesional',
        selectDate: 'Por favor selecciona una fecha para la cita',
        selectTime: 'Por favor selecciona una hora para la cita',
        professionalNotAvailable: 'Este profesional no está disponible para reservas en este momento',
        professionalCannotAccept: 'Este profesional no puede aceptar citas. Selecciona otro profesional',
        missingRequiredData: 'Faltan datos requeridos para crear la cita',
        mustLogin: 'Debes iniciar sesión para crear una cita',
        errorCreating: 'Error al crear la cita',
        errorModifying: 'Error al modificar la cita',
      },
      wizard_success: {
        created: '¡Cita creada exitosamente!',
        modified: '¡Cita modificada exitosamente!',
      },
    },

    // Clients
    clients: {
      title: 'Clientes',
      new_client: 'Nuevo Cliente',
      edit_client: 'Editar Cliente',
      client_details: 'Detalles del Cliente',
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      address: 'Dirección',
      notes: 'Notas',
      total_appointments: 'Total de Citas',
      last_appointment: 'Última Cita',
      next_appointment: 'Próxima Cita',
      create_client: 'Crear Cliente',
      update_client: 'Actualizar Cliente',
      delete_client: 'Eliminar Cliente',
      client_created: 'Cliente creado exitosamente',
      client_updated: 'Cliente actualizado exitosamente',
      client_deleted: 'Cliente eliminado exitosamente',
      no_clients: 'No se encontraron clientes',
      search_clients: 'Buscar clientes...',
      frequent_clients: 'Clientes Frecuentes',
      inactive_clients: 'Clientes Inactivos',
      send_whatsapp: 'Enviar WhatsApp',
      whatsapp_message: '¡Hola! Te extrañamos. ¿Te gustaría agendar una nueva cita?'
    },

    // Services
    services: {
      title: 'Servicios',
      new_service: 'Nuevo Servicio',
      edit_service: 'Editar Servicio',
      service_details: 'Detalles del Servicio',
      name: 'Nombre',
      category: 'Categoría',
      description: 'Descripción',
      duration: 'Duración',
      price: 'Precio',
      color: 'Color',
      active: 'Activo',
      create_service: 'Crear Servicio',
      update_service: 'Actualizar Servicio',
      delete_service: 'Eliminar Servicio',
      service_created: 'Servicio creado exitosamente',
      service_updated: 'Servicio actualizado exitosamente',
      service_deleted: 'Servicio eliminado exitosamente',
      no_services: 'No se encontraron servicios',
      minutes: 'minutos'
    },

    // Reports
    reports: {
      title: 'Reportes',
      business_overview: 'Resumen del Negocio',
      period_selection: 'Selección de Período',
  this_quarter: 'Este Trimestre',
      this_week: 'Esta Semana',
      this_month: 'Este Mes',
      last_year: 'Último Año',
      custom_period: 'Período Personalizado',
      start_date: 'Fecha de Inicio',
      end_date: 'Fecha de Fin',
      generate_report: 'Generar Reporte',
      appointments_by_status: 'Citas por Estado',
      appointments_by_day: 'Citas por Día',
      appointments_by_hour: 'Citas por Hora',
      revenue_overview: 'Resumen de Ingresos',
      top_services: 'Servicios Principales',
      employee_performance: 'Rendimiento de Empleados',
      most_active_days: 'Días Más Activos',
      peak_hours: 'Horas Pico',
      total_revenue: 'Ingresos Totales',
      average_appointment_value: 'Valor Promedio por Cita',
      client_retention: 'Retención de Clientes',
      new_clients: 'Clientes Nuevos',
      returning_clients: 'Clientes Recurrentes',
      no_data_available: 'No hay datos disponibles para el período seleccionado'
    },
    admin: {
      clientManagement: {
        search_placeholder: 'Buscar clientes por nombre, email o teléfono...',
        filter_by_status: 'Filtrar por estado',
        all_statuses: 'Todos los estados',
        status: {
          active: 'Activo',
          inactive: 'Inactivo',
          blocked: 'Bloqueado',
          unknown: 'Desconocido',
          active_plural: 'Activos',
          inactive_plural: 'Inactivos',
          blocked_plural: 'Bloqueados'
        },
        tabs: {
          all: 'Todos',
          recurring: 'Recurrentes',
          at_risk: 'En Riesgo',
          lost: 'Perdidos'
        },
        empty: {
          title: 'No se encontraron clientes',
          description_search: 'Prueba con otros términos de búsqueda',
          description_category: 'No hay clientes en esta categoría'
        },
        badges: {
          total_appointments: 'Total Citas',
          total_value: 'Valor Total'
        },
        last_appointment_prefix: 'Última cita',
        never: 'Nunca',
        actions: {
          schedule: 'Agendar',
          contact: 'Contactar'
        },
        risk: {
          at_risk: 'Cliente en riesgo ({days} días)',
          lost: 'Cliente perdido ({days} días)'
        },
        whatsapp: {
          missing: 'Cliente no tiene WhatsApp registrado',
          message_template: 'Hola {name}, esperamos que estés bien. Te esperamos pronto para tu próxima cita.'
        }
      },
      comprehensiveReports: {
        title: 'Reportes Avanzados',
        subtitle: 'Análisis detallado del rendimiento de tu negocio',
        actions: { update: 'Actualizar', updating: 'Actualizando...' },
        metrics: {
          total_appointments: 'Citas Totales',
          revenue: 'Ingresos',
          average: 'Promedio',
          completion_rate: 'Tasa de Finalización',
          new_in_period: 'nuevos este período'
        },
        tabs: { summary: 'Resumen' },
        descriptions: {
          by_status: 'Distribución por estado en el período seleccionado',
          client_metrics: 'Métricas de retención y crecimiento',
          peak_hours: 'Los días y horas con más citas programadas',
          employee_performance: 'Estadísticas de productividad y eficiencia',
          top_services: 'Los servicios con mayor demanda y rentabilidad',
          recurring_clients: 'Análisis de clientes frecuentes y estado de actividad'
        },
        cards: {
          peak_hours: 'Horarios con Mayor Demanda',
          recurring_clients: 'Clientes Recurrentes',
          client_analysis: 'Análisis de Clientes'
        },
        labels: {
          active_clients: 'Clientes Activos',
          retention_rate: 'Tasa de Retención',
          efficiency: 'eficiencia',
          average_short: 'prom',
          days: 'días',
          at: 'a las',
          last_visit: 'Última visita'
        },
        status: {
          active: 'Activo',
          at_risk: 'En Riesgo',
          lost: 'Perdido'
        },
        whatsapp: {
          missing: 'Este cliente no tiene WhatsApp configurado',
          message_template: '¡Hola {name}! Hemos notado que hace tiempo no vienes a vernos. ¿Te gustaría agendar una nueva cita? ¡Te extrañamos! 😊'
        },
        errors: {
          generate_failed: 'No se pudieron generar los reportes'
        }
      }
    },

    // Calendar
    calendar: {
      title: 'Calendario',
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      agenda: 'Agenda',
      no_appointments: 'No hay citas programadas',
      time_slot_available: 'Disponible',
      time_slot_busy: 'Ocupado',
      view_details: 'Ver Detalles',
      book_appointment: 'Reservar Cita'
    },

    // Locations
    locations: {
      title: 'Ubicaciones',
      new_location: 'Nueva Ubicación',
      edit_location: 'Editar Ubicación',
      location_details: 'Detalles de la Ubicación',
      name: 'Nombre',
      address: 'Dirección',
      city: 'Ciudad',
      country: 'País',
      postal_code: 'Código Postal',
      phone: 'Teléfono',
      email: 'Email',
      active: 'Activo',
      create_location: 'Crear Ubicación',
      update_location: 'Actualizar Ubicación',
      delete_location: 'Eliminar Ubicación',
      location_created: 'Ubicación creada exitosamente',
      location_updated: 'Ubicación actualizada exitosamente',
      location_deleted: 'Ubicación eliminada exitosamente',
      no_locations: 'No se encontraron ubicaciones',
      main_location: 'Ubicación Principal'
    },

    reviews: {
      title: 'Reseñas',
      leaveReview: 'Dejar una Reseña',
      reviewDescription: 'Comparte tu experiencia con otros',
      rating: 'Calificación',
      comment: 'Comentario',
      commentPlaceholder: 'Cuéntanos sobre tu experiencia...',
      shareExperience: 'Tu reseña se publicará de forma anónima',
      submitReview: 'Enviar Reseña',
      submitSuccess: 'Reseña enviada exitosamente',
      anonymous: 'Usuario Anónimo',
      verified: 'Verificado',
      hidden: 'Oculto',
      hide: 'Ocultar',
      show: 'Mostrar',
      delete: 'Eliminar',
      confirmDelete: '¿Estás seguro de que deseas eliminar esta reseña?',
      employeeLabel: 'Profesional',
      businessResponse: 'Respuesta del Negocio',
      respond: 'Responder',
      responsePlaceholder: 'Escribe tu respuesta...',
      submitResponse: 'Enviar Respuesta',
      helpful: 'Útil',
      overallRating: 'Calificación General',
      basedOn: 'Basado en {count} reseñas',
      ratingDistribution: 'Distribución de Calificaciones',
      filterByRating: 'Filtrar por Calificación',
      allRatings: 'Todas las Calificaciones',
      searchReviews: 'Buscar reseñas...',
      noReviews: 'Aún no hay reseñas',
      noReviewsDescription: 'Sé el primero en dejar una reseña',
      review: 'reseña',
      reviewsPlural: 'reseñas',
      ratings: {
        poor: 'Malo',
        fair: 'Regular',
        good: 'Bueno',
        veryGood: 'Muy Bueno',
        excellent: 'Excelente',
      },
      errors: {
        ratingRequired: 'Por favor selecciona una calificación',
        submitFailed: 'Error al enviar la reseña',
        loadFailed: 'Error al cargar las reseñas',
      },
    },

    // Gestión de Jerarquía de Empleados
    employees: {
      management: {
        title: 'Gestión de Empleados',
        subtitle: 'Vista jerárquica con métricas de desempeño',
        totalEmployees: 'Total Empleados',
        byLevel: 'Por Nivel',
        avgOccupancy: 'Ocupación Promedio',
        avgRating: 'Rating Promedio',
        listView: 'Lista',
        mapView: 'Mapa',
        filters: 'Filtros',
        clearFilters: 'Limpiar filtros',
        employeesShown: 'empleados mostrados',
        noEmployees: 'No se encontraron empleados',
        loading: 'Cargando empleados...',
        error: 'Error al cargar empleados',
        retry: 'Reintentar',
      },
      filters: {
        search: 'Buscar por nombre o email',
        searchPlaceholder: 'Escribe para buscar...',
        hierarchyLevel: 'Nivel Jerárquico',
        allLevels: 'Todos los Niveles',
        employeeType: 'Tipo de Empleado',
        allTypes: 'Todos los Tipos',
        department: 'Departamento',
        allDepartments: 'Todos los Departamentos',
        occupancyRange: 'Rango de Ocupación',
        ratingRange: 'Rango de Rating',
        activeFilters: 'Filtros Activos',
        clear: 'Limpiar',
      },
      levels: {
        0: 'Propietario',
        1: 'Administrador',
        2: 'Gerente',
        3: 'Líder de Equipo',
        4: 'Personal',
      },
      hierarchy: {
        changeLevel: 'Cambiar nivel jerárquico de {name}',
        level: 'Nivel',
        note: 'Nota',
        noteLevel: 'El nivel determina la posición en el organigrama',
        noteReports: 'Actualiza el supervisor por separado si es necesario',
        updateSuccess: 'Nivel jerárquico actualizado correctamente',
        updateError: 'Error al actualizar el nivel jerárquico',
        confirmChange: '¿Estás seguro de que quieres cambiar el nivel?',
      },
      types: {
        fullTime: 'Tiempo Completo',
        partTime: 'Medio Tiempo',
        contractor: 'Contratista',
        intern: 'Practicante',
      },
      employeeTypes: {
        service_provider: 'Proveedor de Servicios',
        support_staff: 'Personal de Apoyo',
        location_manager: 'Gerente de Sede',
        manager: 'Gerente',
      },
      departments: {
        sales: 'Ventas',
        service: 'Servicio',
        support: 'Soporte',
        admin: 'Administración',
      },
      card: {
        viewProfile: 'Ver Perfil',
        edit: 'Editar',
        assignSupervisor: 'Asignar Supervisor',
        active: 'Activo',
        inactive: 'Inactivo',
        activate: 'Activar Empleado',
        deactivate: 'Desactivar Empleado',
        confirmDeactivate: '¿Estás seguro de desactivar este empleado? No podrá recibir citas.',
        confirmActivate: '¿Estás seguro de reactivar este empleado?',
        deactivateSuccess: 'Empleado desactivado exitosamente',
        activateSuccess: 'Empleado activado exitosamente',
        toggleError: 'Error al actualizar estado del empleado',
        supervisor: 'Supervisor',
        subordinates: 'Subordinados',
        noSupervisor: 'Sin Supervisor',
        occupancy: 'Ocupación',
        rating: 'Rating',
        revenue: 'Ingresos',
      },
      list: {
        sortBy: 'Ordenar por',
        name: 'Nombre',
        level: 'Nivel',
        occupancy: 'Ocupación',
        rating: 'Rating',
        revenue: 'Ingresos',
        expandAll: 'Expandir Todo',
        collapseAll: 'Colapsar Todo',
      },
      map: {
        zoomIn: 'Acercar',
        zoomOut: 'Alejar',
        resetZoom: 'Restablecer Zoom',
        expandAll: 'Expandir Todo',
        collapseAll: 'Colapsar Todo',
        zoom: 'Zoom',
      },
      actions: {
        updateSuccess: 'Empleado actualizado exitosamente',
        updateError: 'Error al actualizar empleado',
        assignSuccess: 'Supervisor asignado exitosamente',
        assignError: 'Error al asignar supervisor',
        deleteSuccess: 'Empleado eliminado exitosamente',
        deleteError: 'Error al eliminar empleado',
      },
      metrics: {
        appointments: 'Citas',
        completed: 'Completadas',
        pending: 'Pendientes',
        cancelled: 'Canceladas',
        totalRevenue: 'Ingresos Totales',
        avgRating: 'Rating Promedio',
        occupancyRate: 'Tasa de Ocupación',
      },
    },

    // Sistema de Recursos Físicos
    businessResources: {
      title: 'Gestión de Recursos',
      subtitle: 'Administra habitaciones, mesas, canchas y más',
      addResource: 'Agregar Recurso',
      editResource: 'Editar Recurso',
      deleteResource: 'Eliminar Recurso',
      noResources: 'No hay recursos registrados',
      filterByType: 'Filtrar por tipo',
      allTypes: 'Todos los tipos',
      
      form: {
        name: 'Nombre del Recurso',
        namePlaceholder: 'Ej: Habitación 101, Mesa VIP, Cancha #1',
        type: 'Tipo de Recurso',
        location: 'Ubicación',
        selectLocation: 'Seleccionar ubicación',
        capacity: 'Capacidad',
        capacityPlaceholder: 'Número de personas',
        pricePerHour: 'Precio por Hora',
        pricePlaceholder: 'Precio en COP',
        description: 'Descripción',
        descriptionPlaceholder: 'Describe las características del recurso...',
        amenities: 'Servicios / Amenidades',
        amenitiesPlaceholder: 'WiFi, Aire Acondicionado, TV, etc. (separados por comas)',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },

      types: {
        room: 'Habitación',
        table: 'Mesa',
        court: 'Cancha',
        desk: 'Escritorio',
        equipment: 'Equipo',
        vehicle: 'Vehículo',
        space: 'Espacio',
        lane: 'Carril',
        field: 'Campo',
        station: 'Estación',
        parking_spot: 'Parqueadero',
        bed: 'Cama',
        studio: 'Estudio',
        meeting_room: 'Sala de Reuniones',
        other: 'Otro',
      },

      table: {
        name: 'Nombre',
        type: 'Tipo',
        location: 'Ubicación',
        capacity: 'Capacidad',
        price: 'Precio/Hora',
        status: 'Estado',
        actions: 'Acciones',
      },

      status: {
        available: 'Disponible',
        occupied: 'Ocupado',
        maintenance: 'Mantenimiento',
        inactive: 'Inactivo',
      },

      actions: {
        createSuccess: 'Recurso creado exitosamente',
        createError: 'Error al crear el recurso',
        updateSuccess: 'Recurso actualizado exitosamente',
        updateError: 'Error al actualizar el recurso',
        deleteSuccess: 'Recurso eliminado exitosamente',
        deleteError: 'Error al eliminar el recurso',
        confirmDelete: '¿Estás seguro de que deseas eliminar este recurso?',
        deleteWarning: 'Esta acción no se puede deshacer',
      },

      stats: {
        totalResources: 'Total Recursos',
        activeResources: 'Recursos Activos',
        occupancyRate: 'Tasa de Ocupación',
        totalRevenue: 'Ingresos Totales',
      },
    },

    // Sistema de Ausencias y Vacaciones
    absences: {
      title: 'Solicitar Ausencia',
      subtitle: 'Solicita tiempo libre o vacaciones',
      absenceType: 'Tipo de Ausencia',
      selectType: 'Selecciona el tipo',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Fin',
      reason: 'Motivo',
      reasonPlaceholder: 'Describe el motivo de tu ausencia...',
      employeeNotes: 'Notas Adicionales',
      notesPlaceholder: 'Cualquier información adicional...',
      daysRequested: 'Días Solicitados',
      vacationBalance: 'Balance de Vacaciones',
      daysAvailable: 'días disponibles',
      daysRemaining: 'días restantes',
      insufficientBalance: 'Balance de vacaciones insuficiente',
      affectedAppointments: 'Citas Afectadas',
      appointment: 'cita',
      appointments: 'citas',
      noAppointments: 'No hay citas afectadas',
      loadingAppointments: 'Cargando citas...',
      submit: 'Solicitar Ausencia',
      submitting: 'Enviando...',
      cancel: 'Cancelar',
      success: 'Solicitud de ausencia enviada exitosamente',
      error: 'Error al enviar la solicitud de ausencia',
      types: {
        vacation: '🌴 Vacaciones',
        emergency: '🚨 Emergencia',
        sick_leave: '🤒 Incapacidad médica',
        personal: '👤 Asunto personal',
        other: '📋 Otro',
      },
      validation: {
        selectType: 'Selecciona el tipo de ausencia',
        selectStartDate: 'Selecciona la fecha de inicio',
        selectEndDate: 'Selecciona la fecha de fin',
        endAfterStart: 'La fecha de fin debe ser posterior a la de inicio',
        reasonRequired: 'El motivo es requerido',
        maxDays: 'La solicitud no puede exceder 365 días',
      },
      disabledDays: {
        weekend: 'Fin de semana',
        saturday: 'Sábado - Fin de semana',
        sunday: 'Domingo - Fin de semana',
        nonWorkDay: 'Día no laboral',
        holiday: 'Festivo',
      },
      invalidDays: {
        title: 'Días no laborales',
        message: 'Los siguientes días no están en tu horario de trabajo: {days}',
        instruction: 'Por favor, selecciona solamente días en los que trabajas.',
      },
      holidays: {
        title: 'Festivos en el rango',
        message: 'Los siguientes días son festivos públicos y no se pueden solicitar como ausencia: {days}',
        instruction: 'Ajusta tus fechas excluyendo estos días.',
      },
      affected: {
        title: '{count} cita afectada',
        titlePlural: '{count} citas afectadas',
        messageSingle: 'Esta cita será cancelada si se aprueba la ausencia',
        messagePlural: 'Estas citas serán canceladas si se aprueba la ausencia',
      },
      labels: {
        reasonRequired: 'Razón de la Ausencia *',
        reasonPlaceholder: 'Describa brevemente la razón de su ausencia...',
        notesLabel: 'Notas Adicionales (opcional)',
        notesPlaceholder: 'Información adicional que desee compartir...',
        cancelButton: 'Cancelar',
        submitButton: 'Enviar Solicitud',
        submittingButton: 'Enviando...',
      },
      vacationWidget: {
        title: 'Vacaciones',
        titleWithYear: 'Vacaciones {year}',
        totalDays: 'días totales',
        daysAvailable: 'Días Disponibles',
        daysUsed: 'Usados',
        daysPending: 'Pendientes',
        daysFree: 'Libres',
        used: 'Usados',
        pending: 'Pendientes',
        remaining: 'Disponibles',
        noInfo: 'No hay información de vacaciones disponible',
        loading: 'Cargando días de vacaciones...',
      },
    },

    // User Profile
    userProfile: {
      tabs: {
        services: 'Servicios',
        experience: 'Experiencia',
        reviews: 'Reseñas',
      },
      header: {
        completedAppointments: 'citas completadas',
        verifiedProfessional: 'Profesional verificado',
      },
      services: {
        title: 'Servicios',
        noServices: 'No hay servicios disponibles',
        schedule: 'Agendar',
      },
      experience: {
        title: 'Experiencia',
        businessesTitle: 'Negocios donde trabaja',
        independentProfessional: 'Profesional independiente',
        aboutMe: 'Acerca de mí',
        statistics: 'Estadísticas',
        stats: {
          completedAppointments: 'Citas completadas',
          rating: 'Calificación',
          services: 'Servicios',
        },
      },
      reviews: {
        title: 'Reseñas',
        leaveReview: 'Dejar reseña',
      },
      footer: {
        scheduleWith: 'Agendar Cita con {name}',
        notAvailable: 'Profesional no disponible',
        notLinkedMessage: 'Este profesional no está vinculado a ningún negocio activo',
      },
      errors: {
        loadError: 'No se pudo cargar la información del profesional',
        submitReviewError: 'No se puede enviar la reseña en este momento',
      },
      actions: {
        close: 'Cerrar',
      },
    },

    // Tax Configuration
    taxConfiguration: {
      title: 'Configuración Fiscal',
      subtitle: 'Configure los impuestos y obligaciones tributarias de su negocio',
      resetSuccess: 'Configuración restablecida',
      tabs: {
        general: 'General',
        iva: 'IVA',
        ica: 'ICA',
        retention: 'Retención',
      },
      general: {
        taxRegime: 'Régimen Tributario',
        taxRegimeDescription: 'El régimen común cobra IVA, el simplificado generalmente no',
        taxId: 'NIT (Número de Identificación Tributaria)',
        taxIdPlaceholder: '900123456-7',
        taxIdDescription: 'Incluya el dígito de verificación',
        city: 'Ciudad (para ICA)',
        cityDescription: 'Cada ciudad tiene una tarifa de ICA diferente',
        regimes: {
          common: 'Régimen Común',
          simple: 'Régimen Simplificado',
          special: 'Régimen Especial',
        },
      },
      iva: {
        title: 'IVA',
        enable: 'Cobrar IVA',
        description: 'Impuesto al Valor Agregado',
        rate: 'Tasa de IVA (%)',
        rateDescription: '19% es la tasa general en Colombia',
        rates: {
          exempt: '0% (Exento)',
          basic: '5% (Productos básicos)',
          general: '19% (General)',
        },
        infoNote: 'El IVA se calcula sobre el subtotal de cada transacción. Los productos pueden tener tasas diferentes (0%, 5%, 19%).',
      },
      ica: {
        title: 'ICA',
        enable: 'Cobrar ICA',
        description: 'Impuesto de Industria y Comercio',
        rate: 'Tasa de ICA',
        rateCalculated: '(calculado según ciudad)',
        selectCityHint: 'Seleccione la ciudad en la pestaña General para actualizar la tasa',
        cityRates: 'ICA por ciudad:',
      },
      retention: {
        title: 'Retención',
        enable: 'Aplicar Retención en la Fuente',
        description: 'Para grandes contribuyentes',
        activityType: 'Tipo de Actividad',
        rate: 'Tasa de Retención',
        rateDescription: 'Tasa automática según el tipo de actividad seleccionado',
        infoNote: 'La retención en la fuente se descuenta del valor a pagar al proveedor y se debe declarar mensualmente ante la DIAN.',
      },
      summary: {
        title: 'Resumen de Configuración',
        regime: 'Régimen:',
        taxId: 'NIT:',
        city: 'Ciudad:',
        notConfigured: 'No configurado',
        notSelected: 'No seleccionada',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      alerts: {
        simpleRegimeTitle: 'Régimen Simplificado',
        simpleRegimeDescription: 'En régimen simplificado no se cobra IVA. El ICA puede aplicarse según la ciudad.',
      },
    },

    // Admin Dashboard
    adminDashboard: {
      sidebar: {
        dashboard: 'Panel de Control',
        appointments: 'Citas',
        services: 'Servicios',
        employees: 'Empleados',
        locations: 'Sedes',
        chats: 'Chats',
        settings: 'Configuración',
        recruitment: 'Reclutamiento',
        absences: 'Ausencias',
        quickSales: 'Ventas Rápidas',
        accounting: 'Contabilidad',
        reports: 'Reportes',
        businessProfile: 'Perfil del Negocio',
      },
    },

    // Employee Dashboard
    employeeDashboard: {
      sidebar: {
        myEmployments: 'Mis Empleos',
        searchVacancies: 'Buscar Vacantes',
        myAbsences: 'Mis Ausencias',
        myAppointments: 'Mis Citas',
        schedule: 'Horario',
      },
    },

    // Client Dashboard
    clientDashboard: {
      upcomingTitle: 'Próximas Citas',
      viewAll: 'Ver Todo',
      noUpcoming: 'No hay citas próximas',
      bookFirstAppointment: 'Agenda tu primera cita para comenzar',
      bookAppointment: 'Agendar Cita',
      pastTitle: 'Citas Pasadas',
      confirmButton: 'Confirmar',
      alreadyConfirmed: 'Ya confirmada',
      addToCalendar: 'Agregar a Google Calendar',
      deleteAppointment: 'Eliminar cita',
      rebook: 'Reagendar',
      appointment: 'Cita',
      with: 'con',
      confirmDelete: '¿Estás seguro de que deseas eliminar esta cita?',
      deleteSuccess: 'Cita eliminada exitosamente',
      deleteError: 'Error al eliminar la cita',
      errorDeleting: 'Error al eliminar: {message}',
      status: {
        confirmed: 'Confirmada',
        pending: 'Pendiente',
        completed: 'Completada',
        cancelled: 'Cancelada',
        scheduled: 'Agendada',
        inProgress: 'En Curso',
        noShow: 'No Asistió',
      },
      table: {
        service: 'Servicio',
        dateTime: 'Fecha y Hora',
        provider: 'Profesional',
        location: 'Ubicación',
        actions: 'Acciones',
      },
    },

    // Favorites List
    favoritesList: {
      loading: 'Cargando tus negocios favoritos...',
      errorTitle: 'Error al cargar favoritos',
      emptyTitle: 'No tienes favoritos aún',
      emptyDescription: 'Marca tus negocios preferidos como favoritos para acceder rápidamente a ellos y reservar citas más fácilmente.',
      tipHeader: 'Tip: Busca un negocio y haz clic en el ícono de corazón para agregarlo a favoritos',
      bookButton: 'Reservar cita',
      myFavorites: 'Mis Favoritos',
      businessMarked: 'negocio marcado',
      businessesMarked: 'negocios marcados',
      tipDescription: 'como favorito. Haz clic en cualquier tarjeta para ver el perfil completo del negocio, sus servicios, ubicaciones y reseñas. Desde ahí podrás reservar citas fácilmente.',
      removeFavorite: 'Quitar de favoritos',
      removedSuccess: 'Negocio removido de favoritos',
      removedError: 'Error al remover de favoritos',
    },

    // City Selector
    citySelector: {
      selectRegion: 'Seleccionar departamento',
      loading: 'Cargando...',
      noRegions: 'No hay departamentos',
      retry: 'Reintentar',
      allCities: 'Todas las ciudades',
      loadingCities: 'Cargando ciudades...',
    },

    // Business Selector
    businessSelector: {
      selectBusiness: 'Seleccionar negocio',
    },

    // Theme Toggle
    themeToggle: {
      label: 'Cambiar tema',
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema',
    },

    // Role Selector
    roleSelector: {
      label: 'Cambiar Rol',
      admin: 'Administrador',
      employee: 'Empleado',
      client: 'Cliente',
      selectRole: 'Selecciona un rol',
      createBusiness: 'Crear negocio',
      joinBusiness: 'Unirse a negocio',
      bookServices: 'Reservar servicios',
    },

    // Service Status Badge
    serviceStatusBadge: {
      active: 'Activo',
      inactive: 'Inactivo',
    },

    // Language Toggle
    languageToggle: {
      label: 'Idioma',
      spanish: 'Español',
      english: 'English',
    },

    // Owner Badge
    ownerBadge: {
      owner: 'Propietario',
      admin: 'Admin',
    },

    // Business Invitation Card
    businessInvitationCard: {
      copied: 'Código copiado al portapapeles',
      qrGenerated: 'Código QR generado',
      qrError: 'Error al generar código QR',
      qrDownloaded: 'Código QR descargado',
      shareSuccess: 'Compartido exitosamente',
      shareError: 'Error al compartir',
      copyCode: 'Copiar Código',
      generateQR: 'Generar QR',
      downloadQR: 'Descargar QR',
      share: 'Compartir Invitación',
    },

    // Quick Sale Form
    quickSaleForm: {
      title: 'Venta Rápida',
      subtitle: 'Registrar una venta de mostrador',
      clientNameLabel: 'Nombre del Cliente',
      clientPhoneLabel: 'Teléfono',
      clientDocumentLabel: 'Documento',
      clientEmailLabel: 'Email',
      serviceLabel: 'Servicio',
      locationLabel: 'Sede',
      employeeLabel: 'Empleado (Opcional)',
      paymentMethodLabel: 'Método de Pago',
      amountLabel: 'Monto',
      notesLabel: 'Notas',
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      clientNameRequired: 'El nombre del cliente es requerido',
      selectService: 'Selecciona un servicio',
      selectLocation: 'Selecciona una sede',
      enterAmount: 'Ingresa un monto válido',
      selectPaymentMethod: 'Selecciona un método de pago',
      register: 'Registrar Venta',
      loading: 'Cargando...',
      error: 'Error al cargar datos',
      errorRegistering: 'Error al registrar venta',
      successRegistering: 'Venta registrada exitosamente',
      cancel: 'Cancelar',
    },

    // Review Form
    reviewForm: {
      title: 'Dejar una Reseña',
      subtitle: 'Comparte tu experiencia',
      ratingLabel: 'Calificación',
      commentLabel: 'Comentario',
      submitButton: 'Enviar Reseña',
      cancelButton: 'Cancelar',
      selectRating: 'Selecciona una calificación',
      loading: 'Enviando...',
      successSubmit: '¡Gracias por tu reseña!',
      errorSubmit: 'Error al enviar reseña',
    },

    // Review Card
    reviewCard: {
      anonymous: 'Anónimo',
      rating: 'Calificación',
      verified: 'Compra Verificada',
      helpful: 'Útil',
      notHelpful: 'No Útil',
      report: 'Reportar',
      loading: 'Cargando...',
    },

    // Review List
    reviewList: {
      noReviews: 'Sin reseñas aún',
      loading: 'Cargando reseñas...',
      error: 'Error al cargar reseñas',
      sortBy: 'Ordenar por',
      recent: 'Reciente',
      highest: 'Calificación Más Alta',
      lowest: 'Calificación Más Baja',
      mostHelpful: 'Más Útil',
    },

    // Profile Page
    profilePage: {
      title: 'Mi Perfil',
      editProfile: 'Editar Perfil',
      saveChanges: 'Guardar Cambios',
      cancel: 'Cancelar',
      firstName: 'Nombre',
      lastName: 'Apellido',
      email: 'Email',
      phone: 'Teléfono',
      successUpdate: 'Perfil actualizado exitosamente',
      errorUpdate: 'Error al actualizar perfil',
    },

    // Recommended Businesses
    recommendedBusinesses: {
      title: 'Recomendado para Ti',
      noRecommendations: 'Sin recomendaciones disponibles',
      loading: 'Cargando recomendaciones...',
    },

    // Business Suggestions
    businessSuggestions: {
      title: 'Negocios Populares',
      titleWithCity: 'Negocios en {city}',
      frequentTitle: 'Tus negocios frecuentes',
      recommendedTitle: 'Recomendados en tu ciudad',
      singleVisit: '1 cita completada',
      multiVisit: '{count} citas completadas',
      lastVisit: 'Última cita: {date}',
      genericDescription: 'Negocio recomendado',
      noSuggestions: 'Sin sugerencias disponibles',
      loading: 'Cargando sugerencias...',
      viewMore: 'Ver Más',
      basedOnReviews: 'Basado en tus reseñas',
      inCity: 'En',
      bookNow: 'Reservar Ahora',
      bookAgain: 'Reservar de nuevo',
    },

    // Dashboard Overview
    dashboardOverview: {
      title: 'Panel de Control',
      welcomeBack: 'Bienvenido de vuelta',
      upcoming: 'Próximas',
      noUpcoming: 'Sin citas próximas',
      recent: 'Actividad Reciente',
      noActivity: 'Sin actividad reciente',
      viewMore: 'Ver Más',
    },

    // Banner Cropper
    bannerCropper: {
      title: 'Recortar Banner',
      instructions: 'Ajusta el área rectangular para el banner (16:9)',
      confirm: 'Confirmar',
    },

    // Cookie Consent
    cookieConsent: {
      title: 'Usamos cookies para mejorar tu experiencia',
      description: 'Este sitio utiliza cookies analíticas para entender cómo interactúas con nuestra plataforma. No compartimos tus datos con terceros y respetamos tu privacidad.',
      reject: 'Rechazar',
      accept: 'Aceptar cookies',
      close: 'Cerrar',
    },
  }
}
