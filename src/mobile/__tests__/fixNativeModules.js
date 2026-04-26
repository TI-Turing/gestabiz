'use strict'
/**
 * Compatibility shim: react-native@0.74 mocks NativeModules as a plain
 * CommonJS object but jest-expo@55 setup.js expects
 *   require('NativeModules').default
 * to be that same object (ES-module interop assumption).
 *
 * This file must run AFTER react-native/jest/setup.js (which installs the
 * jest.mock factory) and BEFORE jest-expo/src/preset/setup.js (which reads
 * .default).  We achieve that ordering by expanding the preset manually in
 * jest.config.js and inserting this file in the middle of setupFiles.
 */
const nm = require('react-native/Libraries/BatchedBridge/NativeModules')
if (nm && typeof nm === 'object' && nm.default === undefined) {
  nm.default = nm
}
