import { defineConfig, devices } from '@playwright/test';

import { AUTH_STATE_PATH, env } from './src/config/env';

const browserUse = {
  ...devices['Desktop Chrome'],
  ...(env.browserChannel ? { channel: env.browserChannel } : {}),
};

const projects = env.crossBrowser
  ? [
      {
        name: 'setup',
        testMatch: '**/auth/auth.setup.ts',
      },
      {
        name: 'chromium',
        use: { ...browserUse },
        testIgnore: ['**/*.auth.spec.ts'],
      },
      {
        name: 'chromium:auth',
        use: { ...browserUse, storageState: AUTH_STATE_PATH },
        testMatch: '**/*.auth.spec.ts',
        dependencies: ['setup'],
      },
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
        testIgnore: ['**/*.auth.spec.ts'],
      },
      {
        name: 'firefox:auth',
        use: { ...devices['Desktop Firefox'], storageState: AUTH_STATE_PATH },
        testMatch: '**/*.auth.spec.ts',
        dependencies: ['setup'],
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
        testIgnore: ['**/*.auth.spec.ts'],
      },
      {
        name: 'webkit:auth',
        use: { ...devices['Desktop Safari'], storageState: AUTH_STATE_PATH },
        testMatch: '**/*.auth.spec.ts',
        dependencies: ['setup'],
      },
    ]
  : [
      {
        name: 'setup',
        testMatch: '**/auth/auth.setup.ts',
      },
      {
        name: 'chromium',
        use: { ...browserUse },
        testIgnore: ['**/*.auth.spec.ts'],
      },
      {
        name: 'chromium:auth',
        use: { ...browserUse, storageState: AUTH_STATE_PATH },
        testMatch: '**/*.auth.spec.ts',
        dependencies: ['setup'],
      },
    ];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.isCI ? 2 : 0,
  workers: env.isCI ? 2 : undefined,
  timeout: env.testTimeoutMs,
  expect: {
    timeout: env.expectTimeoutMs,
  },
  outputDir: 'test-results',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit/results.xml' }],
  ],
  use: {
    baseURL: env.baseUrl,
    headless: env.headless,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: env.videoMode,
    actionTimeout: env.actionTimeoutMs,
    navigationTimeout: env.navigationTimeoutMs,
    ignoreHTTPSErrors: env.ignoreHttpsErrors,
  },
  projects,
});
