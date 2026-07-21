import { test, expect } from '@fixtures/test-base';
import { productDetailData } from '@test-data/product-detail.data';
import { testTags } from '@utils/test-tags';

test.describe(`Product Detail | Display ${testTags.regression}`, () => {
  test(`should render the product name, a formatted price, and a product image ${testTags.smoke}`, async ({
    productDetailPage,
  }) => {
    await productDetailPage.gotoFromSearch();

    await test.step('Product name renders as a non-empty H1', async () => {
      await expect(productDetailPage.productName).toBeVisible();
      expect((await productDetailPage.productNameText()).length).toBeGreaterThan(0);
    });

    await test.step('At least one price renders in the ¥1,234 / ¥1,234〜 format', async () => {
      const prices = (await productDetailPage.priceElements.allTextContents()).map(text => text.trim());

      expect(prices.length).toBeGreaterThan(0);
      expect(prices.some(price => productDetailData.priceFormat.test(price))).toBe(true);
    });

    await test.step('The image carousel shows an active slide with a real image', async () => {
      await productDetailPage.imageCarousel.expectHasActiveImage();
    });
  });

  test('should show the tax-inclusive price notice', async ({ productDetailPage }) => {
    await productDetailPage.gotoFromSearch();

    await productDetailPage.expectTaxNotice();
  });

  test('should advance the active image when a product has more than one image', async ({ productDetailPage }) => {
    await productDetailPage.gotoFromSearch();

    const imageCount = await productDetailPage.imageCarousel.imageCount();

    // Single-image products have no second slide to navigate to (nav is a no-op) — this behavior
    // is only observable on multi-image products, so skip rather than assert falsely.
    // eslint-disable-next-line playwright/no-skipped-test -- intentional data-dependent runtime skip
    test.skip(imageCount < 2, 'Product has a single image; carousel navigation is not applicable.');

    await productDetailPage.imageCarousel.expectItemBecomesActive(1);
  });

  test('should show a breadcrumb ending in the current product', async ({ productDetailPage }) => {
    await productDetailPage.gotoFromSearch();

    await productDetailPage.expectBreadcrumbTrail();
  });

  test('should render the review summary for a review-eligible product', async ({ productDetailPage }) => {
    await productDetailPage.gotoFromSearch(0, {
      category_code: productDetailData.reviewEligibleCategory,
    });

    await test.step('Review section and star widget render (both empty and populated branches)', async () => {
      await productDetailPage.reviewSummary.expectRendered();
    });

    await test.step('A review count / count link is present', async () => {
      await productDetailPage.reviewSummary.expectCountVisible();
    });
  });
});
