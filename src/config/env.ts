import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';
import { z } from 'zod';

const TEST_ENV = process.env.TEST_ENV ?? 'local';
const ROOT_DIR = process.cwd();

const resolveEnvFiles = (): string[] => {
  const files = ['.env'];

  if (TEST_ENV !== 'local') {
    files.push(`.env.${TEST_ENV}`);
  }

  return files.map((file) => path.resolve(ROOT_DIR, file));
};

for (const envFilePath of resolveEnvFiles()) {
  if (fs.existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath, override: false, quiet: true });
  }
}

const envSchema = z.object({
  BASE_URL: z.string().url().default('https://playwright.dev'),
  BROWSER_CHANNEL: z.string().optional(),
  HEADLESS: z.enum(['true', 'false']).default('true'),
  IGNORE_HTTPS_ERRORS: z.enum(['true', 'false']).default('false'),
  CROSS_BROWSER: z
    .enum(['true', 'false'])
    .default(process.env.CI === 'true' ? 'true' : 'false'),
  VIDEO_MODE: z.enum(['off', 'on', 'retain-on-failure', 'on-first-retry']).default('retain-on-failure'),
  TEST_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  EXPECT_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  ACTION_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  NAVIGATION_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  AUTH_LOGIN_URL: z.string().url().optional(),
  AUTH_USERNAME: z.string().optional(),
  AUTH_PASSWORD: z.string().optional(),
  REVIEW_PRODUCT_CODE_WITH_REVIEWS: z.string().optional(),
  REVIEW_PRODUCT_CODE_NO_REVIEWS: z.string().optional(),
  REVIEW_EDIT_PATH: z.string().optional(),
  PARTNER_BASIC_USERNAME: z.string().optional(),
  PARTNER_BASIC_PASSWORD: z.string().optional(),
});

const parsedEnv = envSchema.parse(process.env);

export const AUTH_STATE_PATH = '.auth/user.json';

export const env = {
  testEnv: TEST_ENV,
  baseUrl: parsedEnv.BASE_URL,
  browserChannel: parsedEnv.BROWSER_CHANNEL,
  headless: parsedEnv.HEADLESS === 'true',
  ignoreHttpsErrors: parsedEnv.IGNORE_HTTPS_ERRORS === 'true',
  crossBrowser: parsedEnv.CROSS_BROWSER === 'true',
  videoMode: parsedEnv.VIDEO_MODE,
  testTimeoutMs: parsedEnv.TEST_TIMEOUT_MS,
  expectTimeoutMs: parsedEnv.EXPECT_TIMEOUT_MS,
  actionTimeoutMs: parsedEnv.ACTION_TIMEOUT_MS,
  navigationTimeoutMs: parsedEnv.NAVIGATION_TIMEOUT_MS,
  isCI: process.env.CI === 'true',
  auth: {
    loginUrl: parsedEnv.AUTH_LOGIN_URL,
    username: parsedEnv.AUTH_USERNAME,
    password: parsedEnv.AUTH_PASSWORD,
  },
  review: {
    productCodeWithReviews: parsedEnv.REVIEW_PRODUCT_CODE_WITH_REVIEWS,
    productCodeNoReviews: parsedEnv.REVIEW_PRODUCT_CODE_NO_REVIEWS,
    editPath: parsedEnv.REVIEW_EDIT_PATH,
  },
  partnerHttpBasic:
    parsedEnv.PARTNER_BASIC_USERNAME && parsedEnv.PARTNER_BASIC_PASSWORD
      ? { username: parsedEnv.PARTNER_BASIC_USERNAME, password: parsedEnv.PARTNER_BASIC_PASSWORD }
      : undefined,
} as const;
