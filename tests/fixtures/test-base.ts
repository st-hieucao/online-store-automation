import { test as base, expect } from '@playwright/test';

import { SearchPage } from '../pages/search.page';
import { ProductDetailPage } from '../pages/product-detail.page';

type AppFixtures = {
  searchPage: SearchPage;
  productDetailPage: ProductDetailPage;
};

export const test = base.extend<AppFixtures>({
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },
});

export { expect };
