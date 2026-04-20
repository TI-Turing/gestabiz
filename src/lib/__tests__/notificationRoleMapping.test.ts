import {
  getNotificationRoleConfig,
  needsRoleSwitch,
  getRequiredRole,
  userHasRole,
  handleNotificationWithRoleSwitch,
  getRoleLabel,
} from '../notificationRoleMapping';
import type { InAppNotification } from '@/types/types';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

function createNotification(
  overrides: Partial<InAppNotification> = {}
): InAppNotification {
  return {
    id: 'n-1',
    user_id: 'u-1',
    type: 'appointment_created',
    title: 'Test Notification',
    message: 'Test message',
    read: false,
    data: {},
    created_at: new Date().toISOString(),
    ...overrides,
  } as InAppNotification;
}

describe('getNotificationRoleConfig', () => {
  it('should return admin config for admin-type notifications', () => {
    const notif = createNotification({ type: 'job_application_new' });
    const config = getNotificationRoleConfig(notif);

    expect(config).not.toBeNull();
    expect(config!.requiredRole).toBe('admin');
    expect(config!.page).toBe('recruitment');
  });

  it('should return employee config for employee-type notifications', () => {
    const notif = createNotification({ type: 'job_application_accepted' });
    const config = getNotificationRoleConfig(notif);

    expect(config).not.toBeNull();
    expect(config!.requiredRole).toBe('employee');
  });

  it('should return client config for client-type notifications', () => {
    const notif = createNotification({ type: 'appointment_created' });
    const config = getNotificationRoleConfig(notif);

    expect(config).not.toBeNull();
    expect(config!.requiredRole).toBe('client');
  });

  it('should return null for unknown notification type', () => {
    const notif = createNotification({ type: 'totally_unknown_type' });
    const config = getNotificationRoleConfig(notif);

    expect(config).toBeNull();
  });

  it('should inject vacancy_id from notification data', () => {
    const notif = createNotification({
      type: 'job_application_new',
      data: { vacancy_id: 'vac-123' },
    });
    const config = getNotificationRoleConfig(notif);

    expect(config!.context!.vacancyId).toBe('vac-123');
  });

  it('should inject appointment_id from notification data', () => {
    const notif = createNotification({
      type: 'appointment_created',
      data: { appointment_id: 'apt-456' },
    });
    const config = getNotificationRoleConfig(notif);

    expect(config!.context!.appointmentId).toBe('apt-456');
  });

  it('should inject conversation_id from notification data', () => {
    const notif = createNotification({
      type: 'chat_message',
      data: { conversation_id: 'conv-789' },
    });
    const config = getNotificationRoleConfig(notif);

    expect(config!.context!.conversationId).toBe('conv-789');
  });

  it('should inject business_id from notification data', () => {
    const notif = createNotification({
      type: 'review_received',
      data: { business_id: 'biz-abc' },
    });
    const config = getNotificationRoleConfig(notif);

    expect(config!.context!.businessId).toBe('biz-abc');
  });

  it('should not mutate the original config map', () => {
    const notif1 = createNotification({
      type: 'job_application_new',
      data: { vacancy_id: 'v-1' },
    });
    const notif2 = createNotification({
      type: 'job_application_new',
      data: { vacancy_id: 'v-2' },
    });

    const config1 = getNotificationRoleConfig(notif1);
    const config2 = getNotificationRoleConfig(notif2);

    expect(config1!.context!.vacancyId).toBe('v-1');
    expect(config2!.context!.vacancyId).toBe('v-2');
  });
});

describe('needsRoleSwitch', () => {
  it('should return true when roles differ', () => {
    const notif = createNotification({ type: 'job_application_new' }); // admin
    expect(needsRoleSwitch(notif, 'client')).toBe(true);
  });

  it('should return false when roles match', () => {
    const notif = createNotification({ type: 'appointment_created' }); // client
    expect(needsRoleSwitch(notif, 'client')).toBe(false);
  });

  it('should return false for unknown notification type', () => {
    const notif = createNotification({ type: 'unknown_type' });
    expect(needsRoleSwitch(notif, 'admin')).toBe(false);
  });
});

describe('getRequiredRole', () => {
  it('should return admin for admin notifications', () => {
    const notif = createNotification({ type: 'employee_request_new' });
    expect(getRequiredRole(notif)).toBe('admin');
  });

  it('should return client for client notifications', () => {
    const notif = createNotification({ type: 'appointment_reminder' });
    expect(getRequiredRole(notif)).toBe('client');
  });

  it('should return null for unknown type', () => {
    const notif = createNotification({ type: 'nonexistent' });
    expect(getRequiredRole(notif)).toBeNull();
  });
});

describe('userHasRole', () => {
  it('should return true for client role (always available)', () => {
    expect(userHasRole('u-1', 'client')).toBe(true);
  });

  it('should verify against provided roles array', () => {
    expect(userHasRole('u-1', 'admin', ['admin', 'client'])).toBe(true);
    expect(userHasRole('u-1', 'employee', ['admin', 'client'])).toBe(false);
  });

  it('should return true for admin/employee without roles array (default)', () => {
    expect(userHasRole('u-1', 'admin')).toBe(true);
    expect(userHasRole('u-1', 'employee')).toBe(true);
  });
});

describe('handleNotificationWithRoleSwitch', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should navigate directly when role matches', async () => {
    const notif = createNotification({ type: 'appointment_created' }); // client
    const switchRole = vi.fn();
    const navigate = vi.fn();

    await handleNotificationWithRoleSwitch(notif, 'client', switchRole, navigate);

    expect(switchRole).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('appointments', expect.any(Object));
  });

  it('should switch role and save pending navigation when roles differ', async () => {
    const notif = createNotification({
      type: 'job_application_new',
      data: { vacancy_id: 'v-1' },
    }); // admin
    const switchRole = vi.fn();
    const navigate = vi.fn();

    await handleNotificationWithRoleSwitch(notif, 'client', switchRole, navigate);

    expect(switchRole).toHaveBeenCalledWith('admin');
    expect(navigate).not.toHaveBeenCalled();

    const pending = JSON.parse(sessionStorage.getItem('pending-navigation')!);
    expect(pending.page).toBe('recruitment');
    expect(pending.context.vacancyId).toBe('v-1');
    expect(pending.timestamp).toBeDefined();
  });

  it('should call onSuccess callback', async () => {
    const notif = createNotification({ type: 'appointment_created' });
    const onSuccess = vi.fn();

    await handleNotificationWithRoleSwitch(notif, 'client', vi.fn(), vi.fn(), {
      onSuccess,
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('should call onError for unknown notification type', async () => {
    const notif = createNotification({ type: 'totally_unknown' });
    const onError = vi.fn();

    await handleNotificationWithRoleSwitch(notif, 'client', vi.fn(), vi.fn(), {
      onError,
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should throw if user lacks required role', async () => {
    const notif = createNotification({ type: 'job_application_new' }); // admin
    const onError = vi.fn();

    await handleNotificationWithRoleSwitch(notif, 'client', vi.fn(), vi.fn(), {
      availableRoles: ['client'],
      onError,
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('does not have access'),
      })
    );
  });

  it('should clean up sessionStorage on error', async () => {
    sessionStorage.setItem('pending-navigation', JSON.stringify({ old: true }));

    const notif = createNotification({ type: 'unknown_type_error' });
    await handleNotificationWithRoleSwitch(notif, 'client', vi.fn(), vi.fn(), {
      onError: vi.fn(),
    });

    expect(sessionStorage.getItem('pending-navigation')).toBeNull();
  });
});

describe('getRoleLabel', () => {
  it('should return Spanish labels by default', () => {
    expect(getRoleLabel('admin')).toBe('Administrador');
    expect(getRoleLabel('employee')).toBe('Empleado');
    expect(getRoleLabel('client')).toBe('Cliente');
  });

  it('should return English labels when locale is en', () => {
    expect(getRoleLabel('admin', 'en')).toBe('Administrator');
    expect(getRoleLabel('employee', 'en')).toBe('Employee');
    expect(getRoleLabel('client', 'en')).toBe('Client');
  });
});
