import { test as base, expect } from '@playwright/test';

import { SearchPage } from '@pages/search.page';
import { MyReviewsPage } from '@pages/my-reviews.page';
import { ItemApiClient } from '@api/item-api.client';

type AppFixtures = {
  searchPage: SearchPage;
  myReviewsPage: MyReviewsPage;
  itemApi: ItemApiClient;
};

export const test = base.extend<AppFixtures>({
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  myReviewsPage: async ({ page }, use) => {
    await use(new MyReviewsPage(page));
  },
  // Pure-HTTP API client (no browser page) built from Playwright's request context.
  itemApi: async ({ request }, use) => {
    await use(new ItemApiClient(request));
  },
});

export { expect };
