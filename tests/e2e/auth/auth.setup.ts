import { test as setup } from '@playwright/test';

import { AUTH_STATE_PATH, env } from '@config/env';

setup('authenticate', async ({ page }) => {
  const { username, password, loginUrl } = env.auth;
  if (!username || !password || !loginUrl) {
    throw new Error('AUTH_USERNAME, AUTH_PASSWORD and AUTH_LOGIN_URL must be set in .env');
  }

  await page.goto(loginUrl);

  await page.locator('[name="username"]').fill(username);
  await page.locator('[name="password"]').fill(password);
  await page.locator('[type="submit"]').first().click();

  const loginHostname = new URL(loginUrl).hostname;
  await page.waitForURL((url) => !url.hostname.includes(loginHostname), {
    timeout: env.testTimeoutMs,
  });

  await page.context().storageState({ path: AUTH_STATE_PATH });
});
