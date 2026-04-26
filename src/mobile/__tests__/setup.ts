/**
 * Global test setup for jest-expo.
 * Mocks all native modules that don't run in Node.js.
 */
// extend-expect se carga automáticamente en @testing-library/jest-native v5+
import type { ReactNode } from 'react'

// ─── React Navigation ────────────────────────────────────────────────────────

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
    }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: jest.fn(),
    NavigationContainer: ({ children }: { children: ReactNode }) => children,
  }
})

// ─── Supabase ────────────────────────────────────────────────────────────────

jest.mock('../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockResolvedValue({ error: null }),
      then: jest.fn(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.jpg' } })),
      })),
    },
    rpc: jest.fn(() => ({
      then: jest.fn(),
    })),
  },
}))

// ─── Auth Context ─────────────────────────────────────────────────────────────

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    },
    session: { access_token: 'test-token' },
    signOut: jest.fn(),
    loading: false,
  }),
}))

// ─── Theme Context ────────────────────────────────────────────────────────────

jest.mock('../src/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      background: '#ffffff',
      card: '#f9fafb',
      cardBorder: '#e5e7eb',
      border: '#e5e7eb',
      text: '#111827',
      textSecondary: '#6b7280',
      textMuted: '#9ca3af',
      primary: '#6366f1',
      mutedForeground: '#6b7280',
      muted: '#f3f4f6',
      destructive: '#ef4444',
      warning: '#f59e0b',
    },
    isDark: false,
    toggleTheme: jest.fn(),
  }),
}))

// ─── Expo vector icons (loads expo-font → expo-asset → global.Expo which fails in tests) ──

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const stub = (name: string) => (props: Record<string, unknown>) =>
    React.createElement('View', { testID: `icon-${name}`, ...props })
  return {
    Ionicons: stub('Ionicons'),
    MaterialIcons: stub('MaterialIcons'),
    FontAwesome: stub('FontAwesome'),
    AntDesign: stub('AntDesign'),
    Feather: stub('Feather'),
    MaterialCommunityIcons: stub('MaterialCommunityIcons'),
    Entypo: stub('Entypo'),
    EvilIcons: stub('EvilIcons'),
    Octicons: stub('Octicons'),
    SimpleLineIcons: stub('SimpleLineIcons'),
    Zocial: stub('Zocial'),
    Foundation: stub('Foundation'),
  }
})

// ─── Expo modules ─────────────────────────────────────────────────────────────

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 4.6097, longitude: -74.0817 },
  }),
  Accuracy: { Balanced: 3 },
}))

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('expo-constants', () => ({
  default: { expoConfig: { name: 'Gestabiz', version: '1.0.3' } },
}))

// ─── React Native modules ─────────────────────────────────────────────────────

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

// ─── Query Client ─────────────────────────────────────────────────────────────

jest.mock('../src/lib/queryClient', () => ({
  QUERY_CONFIG: {
    STABLE: { staleTime: 300000, gcTime: 86400000, refetchOnWindowFocus: false },
    FREQUENT: { staleTime: 60000, gcTime: 600000, refetchOnWindowFocus: true },
    REALTIME: { staleTime: 0, gcTime: 300000, refetchInterval: 30000 },
  },
  QUERY_KEYS: {
    PROFILE: (id: string) => ['profile', id],
    BUSINESS: (id: string) => ['business', id],
    SERVICES: (id: string) => ['services', id],
    EMPLOYEES: (id: string) => ['employees', id],
    LOCATIONS: (id: string) => ['locations', id],
    MY_APPOINTMENTS: (id: string) => ['my-appointments', id],
    AVAILABLE_SLOTS: (id: string, date: string) => ['slots', id, date],
  },
}))
