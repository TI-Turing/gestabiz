import { renderHook, act } from '@testing-library/react';
import { usePreferredCity } from '../usePreferredCity';

const STORAGE_KEY = 'preferred-city';
const DEFAULT_REGION_ID = 'fc6cc79b-dfd1-42c9-b35d-3d0df51c1c83';

describe('usePreferredCity', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with Bogotá D.C. region by default', () => {
    const { result } = renderHook(() => usePreferredCity());

    expect(result.current.preferredRegionId).toBe(DEFAULT_REGION_ID);
    expect(result.current.preferredRegionName).toBe('Bogotá D.C.');
    expect(result.current.preferredCityId).toBeNull();
    expect(result.current.preferredCityName).toBeNull();
  });

  it('should persist default to localStorage', () => {
    renderHook(() => usePreferredCity());

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.regionId).toBe(DEFAULT_REGION_ID);
    expect(stored.regionName).toBe('Bogotá D.C.');
    expect(stored.cityId).toBeNull();
    expect(stored.cityName).toBeNull();
  });

  it('should load existing data from localStorage', () => {
    const data = {
      regionId: 'antioquia-id',
      regionName: 'Antioquia',
      cityId: 'medellin-id',
      cityName: 'Medellín',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const { result } = renderHook(() => usePreferredCity());

    expect(result.current.preferredRegionId).toBe('antioquia-id');
    expect(result.current.preferredRegionName).toBe('Antioquia');
    expect(result.current.preferredCityId).toBe('medellin-id');
    expect(result.current.preferredCityName).toBe('Medellín');
  });

  it('should update state and localStorage via setPreferredCity', () => {
    const { result } = renderHook(() => usePreferredCity());

    act(() => {
      result.current.setPreferredCity('valle-id', 'Valle del Cauca', 'cali-id', 'Cali');
    });

    expect(result.current.preferredRegionId).toBe('valle-id');
    expect(result.current.preferredRegionName).toBe('Valle del Cauca');
    expect(result.current.preferredCityId).toBe('cali-id');
    expect(result.current.preferredCityName).toBe('Cali');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.cityName).toBe('Cali');
  });

  it('should allow setting city to null (region-level filtering)', () => {
    const { result } = renderHook(() => usePreferredCity());

    act(() => {
      result.current.setPreferredCity('antioquia-id', 'Antioquia', null, null);
    });

    expect(result.current.preferredCityId).toBeNull();
    expect(result.current.preferredCityName).toBeNull();
  });

  it('should dispatch custom event on setPreferredCity', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { result } = renderHook(() => usePreferredCity());

    act(() => {
      result.current.setPreferredCity('r-id', 'Region', 'c-id', 'City');
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'preferred-city-changed' })
    );
    dispatchSpy.mockRestore();
  });

  it('should fallback to default on corrupted localStorage data', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json{{{');

    const { result } = renderHook(() => usePreferredCity());

    expect(result.current.preferredRegionId).toBe(DEFAULT_REGION_ID);
    expect(result.current.preferredRegionName).toBe('Bogotá D.C.');
  });

  it('should react to storage events from other tabs', () => {
    const { result } = renderHook(() => usePreferredCity());

    const newData = {
      regionId: 'new-region',
      regionName: 'New Region',
      cityId: 'new-city',
      cityName: 'New City',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY })
      );
    });

    expect(result.current.preferredRegionId).toBe('new-region');
    expect(result.current.preferredCityName).toBe('New City');
  });
});
