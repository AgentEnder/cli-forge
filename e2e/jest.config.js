module.exports = {
  displayName: 'core-e2e',
  globals: {},
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../dist/coverage/e2ecore-e2e',
  testTimeout: 150000,
  globalSetup: '../tools/scripts/start-local-registry.ts',
  globalTeardown: '../tools/scripts/stop-local-registry.ts',
  runInBand: true,
  forceExit: true,
  testEnvironment: 'node',
};
