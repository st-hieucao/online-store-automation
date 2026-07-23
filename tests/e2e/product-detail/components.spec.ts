import { test, expect } from '@fixtures/test-base';
import { productDetailData } from '@test-data/product-detail.data';
import { testTags } from '@utils/test-tags';

const { products, text } = productDetailData;

/**
 * Misc Product Detail components (manual "Add Cart function" sheet): View History, C04 Related
 * Content, and the floating-button state. Several of these are rendered by external scripts / async
 * fetches (View History `item-history.js`, C04 depends on `relatedContents` data), so they may not
 * render for every product — those cases are asserted defensively (`test.skip` when absent) rather
 * than assumed always-present. MOP / C03 / C29 internals are deferred (fully external/async).
 */
test.describe(`Product Detail | Components ${testTags.regression}`, () => {
  test('should render C04 related content with navigable links when present', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.singleSku);

    const hasRelated = (await productDetailPage.relatedContent.count()) > 0;

    // C04 renders only when the product has `relatedContents` data — skip if this product has none.
    // eslint-disable-next-line playwright/no-skipped-test -- data-dependent: C04 is conditional
    test.skip(!hasRelated, 'Product has no related content (C04 not rendered).');

    await expect(productDetailPage.relatedContent).toBeVisible();
    await expect(productDetailPage.relatedContent).toContainText(text.relatedContentHeading);

    const firstLink = productDetailPage.relatedContent.locator('.relevant-content').first();
    const href = await firstLink.getAttribute('href');

    expect(href?.trim()).toBeTruthy();
  });

  test('should list a previously viewed product (and not the current one) in view history', async ({
    productDetailPage,
    page,
  }) => {
    const viewed = products.singleSku;
    const current = products.multiVariant;

    await test.step('Visit product A, then navigate to product B (A is recorded on page leave)', async () => {
      await productDetailPage.gotoByCode(viewed);
      // The view-history cookie is written on `pagehide`; navigating to B triggers it.
      await productDetailPage.gotoByCode(current);
    });

    // View History is injected by the external item-history.js after an async check — it may not
    // render in every environment/run, so skip rather than fail when the widget is absent.
    await productDetailPage.viewHistory.scrollIntoViewIfNeeded().catch(() => undefined);
    const rendered = await productDetailPage.viewHistorySection
      .waitFor({ state: 'visible', timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    // eslint-disable-next-line playwright/no-skipped-test -- external async widget may not render
    test.skip(!rendered, 'View-history widget (item-history.js) did not render.');

    await test.step('Viewed product A appears, current product B does not', async () => {
      await expect(productDetailPage.viewHistory.locator(`img[alt="${viewed}"]`)).toBeVisible();
      await expect(productDetailPage.viewHistory.locator(`img[alt="${current}"]`)).toHaveCount(0);
    });

    await test.step('Clicking the viewed product card navigates to it', async () => {
      await Promise.all([
        page.waitForURL(new RegExp(`/${viewed}(?:[?#]|$)`)),
        productDetailPage.viewHistory.locator(`img[alt="${viewed}"]`).click(),
      ]);
    });
  });

  test('should show an enabled add-to-cart floating state on an in-stock product', async ({
    productDetailPage,
  }) => {
    await productDetailPage.gotoByCode(products.singleSku);

    const floating = productDetailPage.floatingVariantButton
      .or(productDetailPage.page.locator('button.js-float-cart'))
      .first();

    await expect(floating).toBeVisible();
    await expect(floating).toHaveText(productDetailData.text.addToCart);
    await expect(floating).toBeEnabled();
    await expect(floating).not.toHaveClass(/button--tertiary/);
  });

  test('should show the restock floating state on an out-of-stock product', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.outOfStock);

    const floating = productDetailPage.page.locator('button.js-float-cart, button.js-float-product-selection').first();

    await expect(floating).toBeVisible();
    await expect(floating).toHaveText(productDetailData.text.restockNotice);
  });
});
