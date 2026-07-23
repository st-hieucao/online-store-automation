import { test, expect } from '@fixtures/test-base';
import { productDetailData } from '@test-data/product-detail.data';
import { testTags } from '@utils/test-tags';

const { eticket, priceFormat } = productDetailData;

/**
 * Product Detail opened in the eTicket (coupon) context: `/{code}?discount_code=...`. Covers the
 * no-login (guest) rows of the team's "Prd detail - eTicket" / "Add cart - eTicket" manual sheet.
 * `discount_code` is a query param on the same `/{code}` route (`Show.vue`), not a separate page.
 * Logged-in add-cart flows are deferred (need an auth fixture). Uses a pinned valid staging coupon
 * (`productDetailData.eticket`).
 */
test.describe(`Product Detail | eTicket ${testTags.regression}`, () => {
  test('should keep the discount_code in the URL when opening a product', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(eticket.product, { discount_code: eticket.discountCode });

    await productDetailPage.expectQueryParamValue('discount_code', eticket.discountCode);
  });

  test('should render the product detail normally in the eTicket context', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(eticket.product, { discount_code: eticket.discountCode });

    await test.step('Product name renders as a non-empty H1', async () => {
      await expect(productDetailPage.productName).toBeVisible();
      expect((await productDetailPage.productNameText()).length).toBeGreaterThan(0);
    });

    // Image-carousel coverage lives in display.spec.ts against an image-bearing product; the pinned
    // eTicket fixture is a test product with no image, so this test asserts name + price only — the
    // signals that matter for "renders normally in the discount_code context".
    await test.step('At least one price renders in the expected format', async () => {
      const prices = (await productDetailPage.priceElements.allTextContents()).map(text => text.trim());

      expect(prices.length).toBeGreaterThan(0);
      expect(prices.some(price => priceFormat.test(price))).toBe(true);
    });
  });

  test(`should redirect a guest to login when adding to cart with a discount_code ${testTags.smoke}`, async ({
    productDetailPage,
  }) => {
    await productDetailPage.gotoByCode(eticket.product, { discount_code: eticket.discountCode });

    await expect(productDetailPage.addToCartButton.first()).toBeVisible();
    await productDetailPage.addToCartExpectingLoginRedirect();
  });
});
