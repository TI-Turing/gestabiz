/**
 * Jest configuration — Gestabiz Mobile
 *
 * Two projects:
 *   native  – React Native component smoke tests (.test.tsx)
 *   utils   – Pure TypeScript unit tests (.test.ts), plain Node environment
 *
 * Why we expand the jest-expo preset manually for "native":
 *   react-native@0.74 mocks NativeModules without a .default property, but
 *   jest-expo@55 setup.js expects require('NativeModules').default to be an
 *   object.  We fix this by inserting __tests__/fixNativeModules.js between
 *   RN's setup (which installs the mock) and jest-expo's setup (which reads
 *   .default).  Controlling that order requires manual expansion.
 */

'use strict'

const path = require('path')

// ─── Paths ────────────────────────────────────────────────────────────────────

const r = (rel) => path.resolve(__dirname, rel)

const RN_SETUP = r('node_modules/react-native/jest/setup.js')
const RN_ENV   = r('node_modules/react-native/jest/react-native-env.js')
const EXPO_SETUP = r('node_modules/jest-expo/src/preset/setup.js')
const ASSET_TRANSFORM = r('node_modules/jest-expo/src/preset/assetFileTransformer.js')

// ─── Shared transform ─────────────────────────────────────────────────────────

const ASSET_EXT =
  'bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp|xml|m4v|mov|mpeg|mpg|webm|aac|aiff|caf|m4a|mp3|wav|html|pdf|yaml|yml|otf|ttf|zip|heic|avif|db'

const TRANSFORM = {
  [`^.+\\.(${ASSET_EXT})$`]: ASSET_TRANSFORM,
  // Use metro caller so babel-preset-expo applies the right transforms
  '\\.[jt]sx?$': [
    'babel-jest',
    { caller: { name: 'metro', bundler: 'metro', platform: 'ios' } },
  ],
}

// ─── transformIgnorePatterns (same as jest-expo default) ─────────────────────

const TRANSFORM_IGNORE = [
  '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|react-native-svg|@tanstack))',
  '/node_modules/react-native-reanimated/plugin/',
]

// ─── moduleNameMapper ────────────────────────────────────────────────────────

const MODULE_MAPPER = {
  // jest-expo alias
  '^react-native-vector-icons$': '@expo/vector-icons',
  '^react-native-vector-icons/(.*)': '@expo/vector-icons/$1',
  // Project alias
  '^@/(.*)$': '<rootDir>/src/$1',
}

// ─── Projects ────────────────────────────────────────────────────────────────

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    // ── React Native component tests (.test.tsx) ──────────────────────────────
    {
      displayName: 'native',
      testEnvironment: RN_ENV,
      haste: {
        defaultPlatform: 'ios',
        platforms: ['android', 'ios', 'native'],
      },
      transform: TRANSFORM,
      transformIgnorePatterns: TRANSFORM_IGNORE,
      moduleNameMapper: MODULE_MAPPER,
      // ORDER MATTERS: RN setup → our patch → jest-expo setup → our mocks
      setupFiles: [
        RN_SETUP,
        '<rootDir>/__tests__/fixNativeModules.js',
        EXPO_SETUP,
        '<rootDir>/__tests__/setup.ts',
      ],
      testMatch: ['**/__tests__/**/*.test.tsx'],
    },

    // ── Pure TypeScript unit tests (.test.ts) ────────────────────────────────
    {
      displayName: 'utils',
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': [
          'babel-jest',
          { presets: ['babel-preset-expo'] },
        ],
      },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      testMatch: ['**/__tests__/utils.test.ts'],
    },
  ],
}
