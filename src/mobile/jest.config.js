/**
 * Jest configuration — Gestabiz Mobile
 *
 * Two projects:
 *   native  – React Native component smoke tests (.test.tsx), jest-expo preset
 *   utils   – Pure TypeScript unit tests (.test.ts), plain Node environment
 *
 * Note: jest-expo MAJOR version must match Expo SDK MAJOR version.
 *       This project uses Expo SDK 51, so jest-expo@51 is required.
 */

'use strict'

const TRANSFORM_IGNORE = [
  'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@tanstack/.*)',
]

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    // ── React Native component tests (.test.tsx) ──────────────────────────────
    {
      displayName: 'native',
      preset: 'jest-expo',
      setupFiles: ['<rootDir>/__tests__/setup.ts'],
      transformIgnorePatterns: TRANSFORM_IGNORE,
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
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
