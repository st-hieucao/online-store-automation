import { test as base, expect } from '@playwright/test';

import { SearchPage } from '../pages/search.page';
import { ETicketPage } from '@pages/eticket.page';
import { MyReviewsPage } from '../pages/my-reviews.page';
import { ReviewListPage } from '../pages/review-list.page';
import { ReviewFormPage } from '../pages/review-form.page';
import { ProductDetailPage } from '../pages/product-detail.page';
import { PartnerSearchPage } from '@pages/partner-search.page';

type AppFixtures = {
  searchPage: SearchPage;
  eticketPage: ETicketPage;
  myReviewsPage: MyReviewsPage;
  reviewListPage: ReviewListPage;
  reviewFormPage: ReviewFormPage;
  productDetailPage: ProductDetailPage;
  partnerSearchPage: PartnerSearchPage;
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
  reviewListPage: async ({ page }, use) => {
    await use(new ReviewListPage(page));
  },
  reviewFormPage: async ({ page }, use) => {
    await use(new ReviewFormPage(page));
  },
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },
  partnerSearchPage: async ({ page }, use) => {
    await use(new PartnerSearchPage(page));
  },
});

export { expect };
