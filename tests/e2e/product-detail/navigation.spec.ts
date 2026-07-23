import { test, expect } from '@fixtures/test-base';
import { productDetailData } from '@test-data/product-detail.data';
import { testTags } from '@utils/test-tags';

test.describe(`Product Detail | Navigation ${testTags.regression}`, () => {
  test(`should land on the product detail page matching the clicked search card ${testTags.smoke}`, async ({
    productDetailPage,
    page,
  }) => {
    const href = await productDetailPage.gotoFromSearch();

    expect(href).not.toBe('');
    await expect(page).toHaveURL(new RegExp(`${href}(?:[?#]|$)`));
    expect((await productDetailPage.productNameText()).length).toBeGreaterThan(0);
  });

  test('should navigate to the full review list from the review summary link', async ({
    productDetailPage,
    page,
  }) => {
    await productDetailPage.gotoFromSearch(0, {
      category_code: productDetailData.reviewEligibleCategory,
    });
    await productDetailPage.reviewSummary.expectRendered();

    const isEmpty = await productDetailPage.reviewSummary.isEmptyState();
    const link = productDetailPage.reviewSummary.reviewListLink(isEmpty);

    await Promise.all([page.waitForURL(productDetailData.reviewListUrlPattern), link.first().click()]);

    await expect(page).toHaveURL(productDetailData.reviewListUrlPattern);
  });

  test('should navigate to another product when clicking a related-products card', async ({
    productDetailPage,
    page,
  }) => {
    await productDetailPage.gotoFromSearch();

    const hasRelated = (await productDetailPage.relatedProducts.count()) > 0;

    // The C55 recommendation carousel is data-driven and may not render for every product; when it
    // is absent there is nothing to navigate, so skip rather than assert falsely.
    // eslint-disable-next-line playwright/no-skipped-test -- intentional data-dependent runtime skip
    test.skip(!hasRelated, 'No related-products carousel rendered for this product.');

    const originUrl = page.url();

    // C55 cards navigate via a JS click handler (not an <a href>), so assert the URL changes to a
    // different detail page rather than reading an href.
    await Promise.all([
      page.waitForURL(url => productDetailData.detailUrlPattern.test(url.pathname) && url.href !== originUrl),
      productDetailPage.relatedCards.first().click(),
    ]);

    await expect(page).toHaveURL(productDetailData.detailUrlPattern);
    expect(page.url()).not.toBe(originUrl);
    expect((await productDetailPage.productNameText()).length).toBeGreaterThan(0);
  });
});
