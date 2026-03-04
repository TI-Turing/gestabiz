// Employee Profile Modals — EmployeeProfileModal, EmployeeOccupancyModal,
// EmployeeAppointmentsModal, EmployeeRevenueModal

export const employeeProfile = {

  // ── Shared period selector ────────────────────────────────────────────────
  periods: {
    '7d': '7 days',
    '30d': '30 days',
    '90d': '90 days',
    '6m':  '6 months',
    '1y':  '1 year',
    all:   'All',
  },

  // ── EmployeeProfileModal ──────────────────────────────────────────────────
  modal: {
    tabs: {
      info:    'Information',
      payroll: 'Payroll',
    },
    hierarchy: {
      0:       'Owner',
      1:       'Administrator',
      2:       'Manager',
      3:       'Team Lead',
      4:       'Staff',
      unknown: 'Unknown',
    },
    expertise: {
      1: 'Beginner',
      2: 'Basic',
      3: 'Intermediate',
      4: 'Advanced',
      5: 'Expert',
      levelFallback: 'Level',
    },
    days: {
      monday:    'Mon',
      tuesday:   'Tue',
      wednesday: 'Wed',
      thursday:  'Thu',
      friday:    'Fri',
      saturday:  'Sat',
      sunday:    'Sun',
    },
    absenceTypes: {
      vacation:   'Vacation',
      emergency:  'Emergency',
      sick_leave: 'Medical Leave',
      personal:   'Personal Leave',
      other:      'Other',
    },
    cargo: {
      title:       'Position',
      placeholder: 'e.g.: Receptionist, Stylist, Therapist...',
      noAssigned:  'No position assigned',
      editTitle:   'Edit position',
      updated:     'Position updated',
      updateError: 'Error updating position',
      viewOrgChart:'View org chart',
    },
    supervisor: {
      label:            'Direct manager:',
      none:             'No direct manager',
      unassigned:       'Unassigned',
      changeTitle:      'Change direct manager',
      selectPlaceholder:'Select manager...',
      updated:          'Direct manager updated',
      updateError:      'Error updating direct manager',
      unknownError:     'Unknown error',
    },
    contact: {
      title:           'Contact Information',
      email:           'Email',
      phone:           'Phone',
      linkedin:        'LinkedIn',
      portfolio:       'Portfolio',
      experience:      'Experience',
      specializations: 'Specializations',
      summary:         'Professional Summary',
      notSpecified:    'Not specified',
      yearSingular:    'year',
      yearPlural:      'years',
    },
    work: {
      title:    'Work Information',
      hireDate: 'Hire Date',
      role:     'Role',
    },
    schedule: {
      title:        'Work Schedule',
      nonWorkDay:   'Non-working',
      notConfigured:'Not configured',
      lunchBreak:   'Lunch break:',
      noLunchBreak: 'No lunch break configured',
    },
    location: {
      title: 'Assigned Location',
    },
    stats: {
      rating:               'Rating',
      reviews:              'reviews',
      occupancy:            'Occupancy',
      occupancyDetail:      'View occupancy detail →',
      occupancyTooltip:     'Occupancy for the last 30 days. Click to see the full analysis.',
      completedAppointments:'Completed Appointments',
      completedDetail:      'View appointment history →',
      completedTooltip:     'Appointments attended in the last 30 days. Click to see the full history.',
      totalRevenue:         'Total Revenue',
      revenueDetail:        'View revenue breakdown →',
      revenueTooltip:       'Revenue from completed appointments. Click to see the breakdown by period, service and client.',
    },
    services: {
      title:    'Services offered',
      subtitle: 'Services this employee is authorized to manage',
      more:     'more services',
    },
    absences: {
      title:       'Absences & Vacations',
      onlyApproved:'Approved only',
      empty:       'No approved absences on record',
      daySingular: 'day',
      dayPlural:   'days',
    },
    orgChart: {
      title:   'Business Org Chart',
      noData:  'No hierarchy data available',
    },
    reviews: {
      title: 'Reviews for {name}',
    },
    close: 'Close',
  },

  // ── EmployeeOccupancyModal ────────────────────────────────────────────────
  occupancy: {
    headerTitle: 'Occupancy',
    infoTooltip: 'Occupancy reflects the percentage of completed appointments over the total appointments assigned in a period. Future appointments are shown as a projection subject to client cancellations.',
    loading:     'Loading occupancy data…',

    stats: {
      occupancy:        'Occupancy',
      occupancyTooltip: "Completed appointments / total in the selected period.",
      global30d:        'Global 30d: {rate}%',
      completed:        'Completed',
      completedTooltip: "Appointments with 'completed' status in the period.",
      ofTotal:          'of {total} total',
      cancelled:        'Cancelled',
      cancelledTooltip: 'Includes cancellations and no-shows.',
      cancelledPct:     '{pct}% of total',
      future:           'Future appointments',
      futureTooltip:    'Confirmed or pending appointments from today. Subject to cancellations.',
      futureConfirmed:  'upcoming confirmed',
    },

    chart: {
      title:          'Activity in the period',
      tooltip:        'Green = completed. Blue = confirmed. Red = cancelled.',
      noData:         'No appointments in this period',
      completed:      'Completed',
      confirmed:      'Confirmed',
      cancelled:      'Cancelled',
      cancelledNoShow:'Cancelled / No-show',
    },

    future: {
      title:   'Upcoming confirmed appointments',
      tooltip: 'Future occupancy projection. These appointments may be cancelled by clients.',
      empty:   'No upcoming appointments on record',
      badge:   '{count} appointments',
      service: 'Service',
    },

    peak: {
      title:        'Peak hours',
      tooltip:      'Number of completed or confirmed appointments per hour of the day.',
      noData:       'No hour data available',
      appointments: 'Appointments',
    },

    services: {
      title:        'Most frequent services',
      noData:       'No service data available',
      appointments: '{count} appointments',
      noService:    'No service',
    },

    progress: {
      title:   'Occupancy rate in the period',
      low:     'Low occupancy',
      optimal: 'Optimal',
    },

    status: {
      confirmed: 'Confirmed',
      pending:   'Pending',
    },
  },

  // ── EmployeeAppointmentsModal ─────────────────────────────────────────────
  appointments: {
    headerTitle:  'Completed appointments',
    infoTooltip:  "History of appointments with 'completed' status attended by this employee in the selected period.",
    loading:      'Loading appointments…',

    stats: {
      completed:   'Completed',
      revenue:     'Revenue',
      avgDuration: 'Avg duration',
    },

    searchPlaceholder: 'Search by client, service or location…',
    empty:             'No completed appointments in this period',
    noResults:         'No appointments match the search',
    countSingular:     '{count} appointment',
    countPlural:       '{count} appointments',
    found:             'found',

    row: {
      unknownClient:  'Unknown client',
      fullDate:       'Full date',
      endTime:        'End time',
      duration:       'Duration',
      location:       'Location',
      clientPhone:    'Client phone',
      serviceValue:   'Service value',
      notes:          'Notes',
      minutes:        '{count} minutes',
    },
  },

  // ── EmployeeRevenueModal ──────────────────────────────────────────────────
  revenue: {
    headerTitle:  'Revenue',
    infoTooltip:  'Revenue calculated from completed appointments by this employee. Only services with a registered price are counted.',
    loading:      'Calculating revenue…',
    empty:        'No revenue recorded in this period',

    kpis: {
      periodRevenue: 'Period revenue',
      currency:      'COP',
      avgTicket:     'Avg ticket',
      appointments:  '{count} appointments',
      bestPeriod:    'Best period',
    },

    comparison: {
      '7d':    'Previous 7 days',
      '30d':   'Previous 30 days',
      '90d':   'Previous 90 days',
      '6m':    'Previous 6 months',
      '1y':    'Previous year',
      noData:  'No prior data',
      previous:'Before: ${amount}',
    },

    charts: {
      evolution:    'Revenue trend',
      byService:    'Revenue by service',
      participation:'Share',
      revenue:      'Revenue',
    },

    clients: {
      title:         'Top clients',
      countSingular: 'appointment',
      countPlural:   'appointments',
    },

    locations: {
      title:         'Revenue by location',
      singleLocation:'All activity at {name}',
      countSingular: 'appointment',
      countPlural:   'appointments',
    },
  },
}
