// Settings - Complete with ALL preferences
export const settings = {
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
      allowOnlineBooking: {
        label: 'Allow online bookings',
        description: 'Let clients book appointments online'
      },
      autoConfirm: {
        label: 'Automatic confirmation',
        description: 'Automatically confirm new appointments'
      },
      autoReminders: {
        label: 'Automatic reminders',
        description: 'Send reminders automatically to clients'
      },
      showPrices: {
        label: 'Show prices publicly',
        description: 'Display service prices in public profiles'
      }
    },
    nameRequired: 'Business name is required',
    saveSettings: 'Save Settings'
  },

  // Employee Preferences
  employeePrefs: {
    title: 'Employee Preferences',
    subtitle: 'Configure your work preferences',
    profileUpdateSuccess: 'Profile updated successfully',
    profileUpdateError: 'Error updating profile',
    availability: {
      title: 'Availability',
      description: 'Manage your availability for assignments and reminders',
      availableForHire: {
        label: 'Available for hire',
        description: 'Let businesses know you are open to new opportunities'
      },
      notifyAssignments: {
        label: 'Notify assignments',
        description: 'Receive notifications for new assignments'
      },
      reminders: {
        label: 'Reminders',
        description: 'Receive reminders about your schedule and appointments'
      },
      availableForAppointments: 'Available for new appointments',
      notifyNewAssignments: 'Notify new assignments',
      appointmentReminders: 'Appointment reminders'
    },
    schedule: {
      title: 'My Work Schedule',
      description: 'Set your working hours for each day of the week',
      days: {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday'
      },
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
      description: 'When enabled, clients can send you direct messages',
      allowClientMessages: {
        label: 'Allow client messages',
        description: 'When enabled, clients can send you direct messages',
        successEnabled: 'Client messages enabled',
        successDisabled: 'Client messages disabled',
        errorBusinessId: 'Business ID is required to update this setting',
        error: 'Error updating client messages setting'
      }
    },
    professionalInfo: {
      title: 'Professional Information',
      subtitle: 'Your experience and preferred work type',
      description: 'Tell us about your professional background',
      summaryLabel: 'Professional Summary',
      summaryPlaceholder: 'Describe your experience, skills, and specialties...',
      minCharacters: '{count} / 50 minimum characters',
      yearsExperienceLabel: 'Years of Experience',
      workTypeLabel: 'Preferred Work Type',
      errors: {
        summaryTooShort: 'The summary must have at least 50 characters',
        experienceRange: 'Experience must be between 0 and 50 years'
      },
      workTypes: {
        fullTime: 'Full Time',
        partTime: 'Part Time',
        contract: 'Contract',
        flexible: 'Flexible'
      }
    },
    salary: {
      title: 'Salary Expectations',
      description: 'Define your expected salary range',
      minLabel: 'Minimum Expected Salary',
      maxLabel: 'Maximum Expected Salary',
      minPlaceholder: 'Min amount',
      maxPlaceholder: 'Max amount',
      invalidRange: 'The minimum salary cannot be greater than the maximum',
      errors: {
        minGreaterThanMax: 'The minimum salary cannot be greater than the maximum'
      }
    },
    specializations: {
      title: 'Specializations',
      description: 'List your professional specializations',
      noSpecializations: 'No specializations added yet',
      newPlaceholder: 'New specialization',
      placeholder: 'Enter a specialization',
      successAdd: 'Specialization added successfully',
      successRemove: 'Specialization removed successfully',
      addButton: 'Add'
    },
    languages: {
      title: 'Languages',
      description: 'Add the languages you speak',
      noLanguages: 'No languages added yet',
      newPlaceholder: 'Language (e.g., English - Advanced)',
      placeholder: 'Enter a language',
      successAdd: 'Language added successfully',
      successRemove: 'Language removed successfully',
      addButton: 'Add'
    },
    certifications: {
      title: 'Certifications and Licenses',
      description: 'Show your certifications and credentials',
      noCertifications: 'No certifications added yet',
      addButton: 'Add Certification',
      namePlaceholder: 'Certification name *',
      issuerPlaceholder: 'Issuer *',
      issueDatePlaceholder: 'Issue date *',
      expiryDatePlaceholder: 'Expiry date',
      credentialIdPlaceholder: 'Credential ID',
      credentialUrlPlaceholder: 'Credential URL',
      issuedLabel: 'Issued',
      expiresLabel: 'Expires',
      viewCredential: 'View credential',
      requiredFields: 'Please complete all required fields',
      successAdd: 'Certification added successfully',
      successRemove: 'Certification removed successfully',
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
      description: 'Add your professional links',
      portfolioLabel: 'Portfolio / Website',
      portfolioPlaceholder: 'https://your-portfolio.com',
      linkedinLabel: 'LinkedIn',
      linkedinPlaceholder: 'https://linkedin.com/in/yourprofile',
      githubLabel: 'GitHub',
      githubPlaceholder: 'https://github.com/your-username'
    },
    saveButton: 'Save Preferences',
    saveChanges: 'Save Changes',
    resetButton: 'Reset'
  },

  // Client Preferences
  clientPrefs: {
    title: 'Client Preferences',
    subtitle: 'Configure your booking preferences',
    bookingPrefs: {
      title: 'Booking Preferences',
      description: 'Manage how you want to receive booking information',
      reminders: {
        label: 'Appointment reminders',
        description: 'Receive reminders before your appointment'
      },
      emailConfirmation: {
        label: 'Email confirmation',
        description: 'Receive a confirmation email after booking'
      },
      promotions: {
        label: 'Promotions',
        description: 'Receive promotions and special offers'
      },
      savePayment: {
        label: 'Save payment method',
        description: 'Save your payment method for faster checkout'
      },
      appointmentReminders: 'Appointment reminders',
      emailConfirmation: 'Email confirmation',
      promotionNotifications: 'Promotion notifications',
      savePaymentMethods: 'Save payment methods'
    },
    advanceTime: {
      title: 'Preferred Advance Time',
      description: 'How far in advance you prefer to book appointments',
      label: 'Preferred notice time for appointments',
      options: {
        oneHour: '1 hour',
        twoHours: '2 hours',
        fourHours: '4 hours',
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
      description: 'We use this to suggest similar services',
      completedServices: '{count} completed services',
      viewHistory: 'View history'
    },
    paymentMethods: {
      title: 'Payment Methods',
      noneAdded: 'No payment methods added',
      options: {
        card: 'Credit/Debit Card',
        cash: 'Cash',
        transfer: 'Bank Transfer',
        pse: 'PSE'
      },
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
    description: 'Irreversible account actions',
    warning: {
      label: 'Warning',
      message: 'These actions are permanent and cannot be undone. Proceed with extreme caution.'
    },
    deactivate: {
      title: 'Deactivate Account',
      subtitle: 'Temporarily suspend your account. You can reactivate it anytime.',
      description: 'Temporarily suspend your account. You can reactivate it anytime.',
      button: 'Deactivate Account',
      whatHappens: 'What happens when you deactivate?',
      consequences: {
        markedInactive: 'Your account will be marked as inactive',
        sessionClosed: 'All active sessions will be closed',
        futureAppointments: 'Future appointments will be cancelled',
        noLogin: 'You will not be able to log in',
        dataPreserved: 'All your data will be preserved'
      },
      dataNotDeleted: 'Your data will NOT be deleted',
      contactSupport: 'To reactivate, simply log in again or contact support',
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
      step1Title: 'Confirm Your Identity',
      step2Title: 'Final Confirmation',
      step1Description: 'Please verify your email address to continue',
      step2Description: 'This is your last chance to cancel',
      step1Warning: 'This will permanently delete your account and all associated data',
      emailPrompt: 'Confirm your email',
      emailPlaceholder: 'your@email.com',
      understandCheckbox: 'I understand this action is permanent and irreversible',
      finalWarning: 'Final Warning',
      typeExactly: 'Type exactly',
      confirmPlaceholder: 'DEACTIVATE ACCOUNT',
      confirmDetails: 'What will be deleted',
      accountLabel: 'Account',
      profileLabel: 'Profile',
      rolesLabel: 'Roles',
      activeLabel: 'active',
      appointmentsLabel: 'Appointments',
      cancelledAuto: 'Automatically cancelled',
      dataPreservedNote: 'Historical data will be preserved for legal compliance',
      continue: 'Continue',
      deactivating: 'Deactivating',
      deactivateNow: 'Deactivate Now',
      successTitle: 'Account deactivated successfully',
      successDescription: 'Your account has been deactivated. You can reactivate it by logging in again.',
      errorTitle: 'Error deactivating account',
      unknownError: 'An unknown error occurred',
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
      mustTypeCorrectly: 'You must type "DEACTIVATE ACCOUNT" to confirm',
      cancel: 'Cancel',
      confirm: 'Yes, delete permanently',
      processing: 'Processing...'
    }
  }
};
