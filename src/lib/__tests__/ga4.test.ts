import { initializeGA4, updateGA4Consent, isGA4Ready } from '../ga4';

// Mock react-ga4
vi.mock('react-ga4', () => ({
  default: {
    initialize: vi.fn(),
    send: vi.fn(),
  },
}));

import ReactGA from 'react-ga4';

describe('ga4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the module-level isInitialized state
    vi.resetModules();
  });

  describe('initializeGA4', () => {
    it('should not initialize without measurement ID', async () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
      const mod = await import('../ga4');
      mod.initializeGA4();
      expect(ReactGA.initialize).not.toHaveBeenCalled();
      vi.unstubAllEnvs();
    });

    it('should not initialize in development without force flag', async () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
      vi.stubEnv('VITE_GA_FORCE_IN_DEV', '');
      // import.meta.env.DEV is true in vitest
      const mod = await import('../ga4');
      mod.initializeGA4();
      expect(ReactGA.initialize).not.toHaveBeenCalled();
      vi.unstubAllEnvs();
    });

    it('should initialize when force flag is set in dev', async () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
      vi.stubEnv('VITE_GA_FORCE_IN_DEV', 'true');
      const mod = await import('../ga4');
      mod.initializeGA4();
      expect(ReactGA.initialize).toHaveBeenCalledWith(
        'G-TEST123',
        expect.objectContaining({
          gaOptions: expect.objectContaining({ anonymizeIp: true }),
        })
      );
      vi.unstubAllEnvs();
    });

    it('should send initial pageview after initialization', async () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
      vi.stubEnv('VITE_GA_FORCE_IN_DEV', 'true');
      const mod = await import('../ga4');
      mod.initializeGA4();
      expect(ReactGA.send).toHaveBeenCalledWith(
        expect.objectContaining({ hitType: 'pageview' })
      );
      vi.unstubAllEnvs();
    });

    it('should not initialize twice', async () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
      vi.stubEnv('VITE_GA_FORCE_IN_DEV', 'true');
      const mod = await import('../ga4');
      mod.initializeGA4();
      mod.initializeGA4();
      expect(ReactGA.initialize).toHaveBeenCalledTimes(1);
      vi.unstubAllEnvs();
    });
  });

  describe('isGA4Ready', () => {
    it('should return false before initialization', async () => {
      const mod = await import('../ga4');
      expect(mod.isGA4Ready()).toBe(false);
    });

    it('should return true after initialization', async () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
      vi.stubEnv('VITE_GA_FORCE_IN_DEV', 'true');
      const mod = await import('../ga4');
      mod.initializeGA4();
      expect(mod.isGA4Ready()).toBe(true);
      vi.unstubAllEnvs();
    });
  });

  describe('updateGA4Consent', () => {
    it('should do nothing if GA4 is not initialized', () => {
      // Without init, no gtag
      updateGA4Consent(true);
      // Should not throw
    });

    it('should call gtag consent update when initialized and gtag exists', async () => {
      const mockGtag = vi.fn();
      Object.defineProperty(window, 'gtag', {
        value: mockGtag,
        writable: true,
        configurable: true,
      });

      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
      vi.stubEnv('VITE_GA_FORCE_IN_DEV', 'true');
      const mod = await import('../ga4');
      mod.initializeGA4();
      mod.updateGA4Consent(true);

      expect(mockGtag).toHaveBeenCalledWith('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      vi.unstubAllEnvs();
    });

    it('should set analytics_storage to denied when consent is false', async () => {
      const mockGtag = vi.fn();
      Object.defineProperty(window, 'gtag', {
        value: mockGtag,
        writable: true,
        configurable: true,
      });

      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
      vi.stubEnv('VITE_GA_FORCE_IN_DEV', 'true');
      const mod = await import('../ga4');
      mod.initializeGA4();
      mod.updateGA4Consent(false);

      expect(mockGtag).toHaveBeenCalledWith(
        'consent',
        'update',
        expect.objectContaining({ analytics_storage: 'denied' })
      );
      vi.unstubAllEnvs();
    });
  });
});
