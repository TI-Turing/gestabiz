import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeolocation } from '../useGeolocation';

// Mock navigator.permissions
const mockPermissionsQuery = vi.fn();
Object.defineProperty(navigator, 'permissions', {
  value: { query: mockPermissionsQuery },
  writable: true,
});

describe('useGeolocation', () => {
  const mockGetCurrentPosition = vi.fn();
  const mockWatchPosition = vi.fn();
  const mockClearWatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: mockGetCurrentPosition,
        watchPosition: mockWatchPosition,
        clearWatch: mockClearWatch,
      },
      writable: true,
    });
    mockPermissionsQuery.mockResolvedValue({ state: 'prompt' });
  });

  it('should return initial state', () => {
    // Prevent requestOnMount side effects
    mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
    const { result } = renderHook(() => useGeolocation({ requestOnMount: false, showPermissionPrompt: false }));

    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
    expect(result.current.accuracy).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.hasLocation).toBe(false);
  });

  it('should set loading to true when requesting location', async () => {
    mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
    mockGetCurrentPosition.mockImplementation(() => {
      // Never resolves — stays loading
    });

    const { result } = renderHook(() => useGeolocation({ requestOnMount: false, showPermissionPrompt: false }));

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.loading).toBe(true);
  });

  it('should update state on successful position', async () => {
    mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
    mockGetCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 6.2442,
          longitude: -75.5812,
          accuracy: 10,
        },
      });
    });

    const { result } = renderHook(() => useGeolocation({ requestOnMount: false, showPermissionPrompt: false }));

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.latitude).toBe(6.2442);
    expect(result.current.longitude).toBe(-75.5812);
    expect(result.current.accuracy).toBe(10);
    expect(result.current.loading).toBe(false);
    expect(result.current.hasLocation).toBe(true);
    expect(result.current.isPermissionGranted).toBe(true);
  });

  it('should handle permission denied error', async () => {
    mockPermissionsQuery.mockResolvedValue({ state: 'denied' });
    mockGetCurrentPosition.mockImplementation((_success, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    });

    const { result } = renderHook(() => useGeolocation({ requestOnMount: false, showPermissionPrompt: false }));

    await act(async () => {
      result.current.requestLocation();
    });

    await waitFor(() => {
      expect(result.current.error).toContain('Permiso de ubicación denegado');
      expect(result.current.loading).toBe(false);
      expect(result.current.isPermissionDenied).toBe(true);
    });
  });

  it('should handle position unavailable error', async () => {
    mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
    mockGetCurrentPosition.mockImplementation((_success, error) => {
      error({
        code: 2, // POSITION_UNAVAILABLE
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    });

    const { result } = renderHook(() => useGeolocation({ requestOnMount: false, showPermissionPrompt: false }));

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.error).toContain('no está disponible');
    expect(result.current.loading).toBe(false);
  });

  it('should handle timeout error', async () => {
    mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
    mockGetCurrentPosition.mockImplementation((_success, error) => {
      error({
        code: 3, // TIMEOUT
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    });

    const { result } = renderHook(() => useGeolocation({ requestOnMount: false, showPermissionPrompt: false }));

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.error).toContain('tiempo límite');
    expect(result.current.loading).toBe(false);
  });

  it('should handle missing geolocation API', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation({ requestOnMount: false, showPermissionPrompt: false }));

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.error).toContain('no está soportada');
    expect(result.current.loading).toBe(false);
  });

  it('should calculate distance correctly using Haversine formula', () => {
    mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
    const { result } = renderHook(() => useGeolocation({ requestOnMount: false, showPermissionPrompt: false }));

    // Medellín to Bogotá (~250 km)
    const distance = result.current.calculateDistance(6.2442, -75.5812, 4.711, -74.0721);

    expect(distance).toBeGreaterThan(200);
    expect(distance).toBeLessThan(300);
  });

  it('should return 0 distance for same point', () => {
    mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
    const { result } = renderHook(() => useGeolocation({ requestOnMount: false, showPermissionPrompt: false }));

    const distance = result.current.calculateDistance(6.2442, -75.5812, 6.2442, -75.5812);
    expect(distance).toBe(0);
  });

  it('should request location on mount when requestOnMount is true', async () => {
    mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
    mockGetCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 6.2442, longitude: -75.5812, accuracy: 10 },
      });
    });

    await act(async () => {
      renderHook(() => useGeolocation({ requestOnMount: true, showPermissionPrompt: false }));
    });

    expect(mockGetCurrentPosition).toHaveBeenCalled();
  });

  it('should clear watch correctly', () => {
    mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
    const { result } = renderHook(() => useGeolocation({ requestOnMount: false, showPermissionPrompt: false }));

    act(() => {
      result.current.clearWatch(123);
    });

    expect(mockClearWatch).toHaveBeenCalledWith(123);
  });
});
