import { test as base, expect } from '@playwright/test';

import { SearchPage } from '@pages/search.page';
import { ETicketPage } from '@pages/eticket.page';
import { MyReviewsPage } from '@pages/my-reviews.page';

type AppFixtures = {
  searchPage: SearchPage;
  eticketPage: ETicketPage;
  myReviewsPage: MyReviewsPage;
};

export const test = base.extend<AppFixtures>({
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  eticketPage: async ({ page }, use) => {
    await use(new ETicketPage(page));
  },
  myReviewsPage: async ({ page }, use) => {
    await use(new MyReviewsPage(page));
  },
});

export { expect };
