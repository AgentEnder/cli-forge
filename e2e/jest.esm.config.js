/** Jest config for ESM compatibility tests — no local registry needed. */
module.exports = {
  displayName: 'esm-compat',
  globals: {},
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/tests/esm-compat.spec.ts'],
  testTimeout: 60000,
  forceExit: true,
  testEnvironment: 'node',
};
