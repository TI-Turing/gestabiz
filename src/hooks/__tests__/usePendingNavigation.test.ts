import { renderHook } from '@testing-library/react';
import {
  usePendingNavigation,
  clearPendingNavigation,
  hasPendingNavigation,
  getPendingNavigation,
} from '../usePendingNavigation';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

const STORAGE_KEY = 'pending-navigation';

describe('usePendingNavigation', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should not call onNavigate if no pending navigation', () => {
    const onNavigate = vi.fn();
    renderHook(() => usePendingNavigation(onNavigate));

    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('should call onNavigate with page and context from session storage', () => {
    const pending = {
      page: 'recruitment',
      context: { vacancyId: 'v-1' },
      timestamp: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));

    const onNavigate = vi.fn();
    renderHook(() => usePendingNavigation(onNavigate));

    expect(onNavigate).toHaveBeenCalledWith('recruitment', { vacancyId: 'v-1' });
  });

  it('should remove pending navigation after executing', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ page: 'overview', timestamp: Date.now() })
    );

    const onNavigate = vi.fn();
    renderHook(() => usePendingNavigation(onNavigate));

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should discard old pending navigations (beyond maxAge)', () => {
    const oldTimestamp = Date.now() - 10000; // 10s ago
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ page: 'settings', timestamp: oldTimestamp })
    );

    const onNavigate = vi.fn();
    renderHook(() => usePendingNavigation(onNavigate, 5000));

    expect(onNavigate).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should handle corrupted session storage data gracefully', () => {
    sessionStorage.setItem(STORAGE_KEY, 'not-valid-json');

    const onNavigate = vi.fn();
    renderHook(() => usePendingNavigation(onNavigate));

    expect(onNavigate).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should use default maxAge of 5000ms', () => {
    const recentTimestamp = Date.now() - 3000; // 3s ago — within 5s default
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ page: 'employees', timestamp: recentTimestamp })
    );

    const onNavigate = vi.fn();
    renderHook(() => usePendingNavigation(onNavigate));

    expect(onNavigate).toHaveBeenCalledWith('employees', undefined);
  });
});

describe('clearPendingNavigation', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should remove pending navigation from sessionStorage', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ page: 'x', timestamp: 1 }));
    clearPendingNavigation();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('hasPendingNavigation', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should return false when empty', () => {
    expect(hasPendingNavigation()).toBe(false);
  });

  it('should return true when pending exists', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ page: 'x', timestamp: 1 }));
    expect(hasPendingNavigation()).toBe(true);
  });
});

describe('getPendingNavigation', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should return null when no pending navigation', () => {
    expect(getPendingNavigation()).toBeNull();
  });

  it('should return pending navigation data', () => {
    const nav = { page: 'appointments', context: { id: '1' }, timestamp: 123 };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nav));

    const result = getPendingNavigation();
    expect(result).toEqual(nav);
  });

  it('should return null for corrupted data', () => {
    sessionStorage.setItem(STORAGE_KEY, 'broken-json');
    expect(getPendingNavigation()).toBeNull();
  });
});
