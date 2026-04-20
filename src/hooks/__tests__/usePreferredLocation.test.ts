import { renderHook, act } from '@testing-library/react';
import { usePreferredLocation } from '../usePreferredLocation';

const PREFIX = 'preferred-location-';
const BIZ_ID = 'biz-001';

describe('usePreferredLocation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial state with null location when nothing stored', () => {
    const { result } = renderHook(() => usePreferredLocation(BIZ_ID));
    expect(result.current.preferredLocationId).toBeNull();
    expect(result.current.isAllLocations).toBe(true);
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.isExplicitlySet).toBe(false);
  });

  it('should return undefined businessId gracefully', () => {
    const { result } = renderHook(() => usePreferredLocation(undefined));
    expect(result.current.preferredLocationId).toBeNull();
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isExplicitlySet).toBe(false);
  });

  it('should load stored location from localStorage', () => {
    localStorage.setItem(`${PREFIX}${BIZ_ID}`, 'loc-123');
    const { result } = renderHook(() => usePreferredLocation(BIZ_ID));
    expect(result.current.preferredLocationId).toBe('loc-123');
    expect(result.current.isAllLocations).toBe(false);
    expect(result.current.isExplicitlySet).toBe(true);
  });

  it('should treat stored "all" as null (all locations)', () => {
    localStorage.setItem(`${PREFIX}${BIZ_ID}`, 'all');
    const { result } = renderHook(() => usePreferredLocation(BIZ_ID));
    expect(result.current.preferredLocationId).toBeNull();
    expect(result.current.isAllLocations).toBe(true);
    expect(result.current.isExplicitlySet).toBe(true);
  });

  it('should set preferred location and persist to localStorage', () => {
    const { result } = renderHook(() => usePreferredLocation(BIZ_ID));

    act(() => {
      result.current.setPreferredLocation('loc-456');
    });

    expect(result.current.preferredLocationId).toBe('loc-456');
    expect(result.current.isAllLocations).toBe(false);
    expect(result.current.isExplicitlySet).toBe(true);
    expect(localStorage.getItem(`${PREFIX}${BIZ_ID}`)).toBe('loc-456');
  });

  it('should set null to store "all" in localStorage', () => {
    const { result } = renderHook(() => usePreferredLocation(BIZ_ID));

    act(() => {
      result.current.setPreferredLocation(null);
    });

    expect(result.current.preferredLocationId).toBeNull();
    expect(result.current.isAllLocations).toBe(true);
    expect(localStorage.getItem(`${PREFIX}${BIZ_ID}`)).toBe('all');
  });

  it('should isolate storage per businessId', () => {
    localStorage.setItem(`${PREFIX}biz-A`, 'loc-A');
    localStorage.setItem(`${PREFIX}biz-B`, 'loc-B');

    const { result: resultA } = renderHook(() => usePreferredLocation('biz-A'));
    const { result: resultB } = renderHook(() => usePreferredLocation('biz-B'));

    expect(resultA.current.preferredLocationId).toBe('loc-A');
    expect(resultB.current.preferredLocationId).toBe('loc-B');
  });

  it('should react to businessId changes', () => {
    localStorage.setItem(`${PREFIX}biz-A`, 'loc-A');
    localStorage.setItem(`${PREFIX}biz-B`, 'loc-B');

    const { result, rerender } = renderHook(
      ({ id }) => usePreferredLocation(id),
      { initialProps: { id: 'biz-A' as string | undefined } },
    );

    expect(result.current.preferredLocationId).toBe('loc-A');

    rerender({ id: 'biz-B' });
    expect(result.current.preferredLocationId).toBe('loc-B');
  });

  it('should not persist when businessId is undefined', () => {
    const { result } = renderHook(() => usePreferredLocation(undefined));

    act(() => {
      result.current.setPreferredLocation('loc-999');
    });

    // Should be no-op
    expect(localStorage.length).toBe(0);
    expect(result.current.preferredLocationId).toBeNull();
  });

  it('should dispatch and listen to cross-tab custom events', () => {
    const { result: hook1 } = renderHook(() => usePreferredLocation(BIZ_ID));
    const { result: hook2 } = renderHook(() => usePreferredLocation(BIZ_ID));

    act(() => {
      hook1.current.setPreferredLocation('loc-shared');
    });

    // hook2 should pick up the change via the custom event listener
    expect(hook2.current.preferredLocationId).toBe('loc-shared');
  });
});
