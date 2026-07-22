import { test, expect } from '@fixtures/test-base';
import { productDetailData } from '@test-data/product-detail.data';
import { testTags } from '@utils/test-tags';

const { products, text } = productDetailData;

/**
 * Add-to-cart CTA state matrix + the multi-variant overlay, using pinned staging products per state
 * (see `productDetailData.products`). Cross-checked against the team's manual "Add Cart function"
 * sheet. Gold CTA resolves after an async `/skus/user-info` check, so assertions rely on
 * auto-retrying `expect`, not the initial paint. Overlay-add writes to the guest cart (fresh context
 * = empty cart, no cleanup).
 */
test.describe(`Product Detail | CTA states ${testTags.regression}`, () => {
  test('should show the login-to-order CTA for a Gold-member product as a guest', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.gold);

    // Gold CTA renders after the async gold check; both the page-body row and floating bar show it.
    await expect(productDetailPage.loginToOrderButton.first()).toBeVisible();
    await expect(productDetailPage.loginToOrderButton.first()).toHaveText(text.loginToOrder);
    await expect(productDetailPage.addToCartButton).toHaveCount(0);
  });

  test('should open the multi-variant selection overlay from the floating button', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.multiVariant);

    await productDetailPage.openVariantOverlay();

    await expect(productDetailPage.productSelection.rows).toHaveCount(2);
  });

  test(`should add a variant from the selection overlay ${testTags.smoke}`, async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.multiVariant);

    await test.step('Open the overlay and add the first variant', async () => {
      await productDetailPage.openVariantOverlay();
      await productDetailPage.productSelection.addRowToCart(0);
    });

    await test.step('The cart confirmation appears', async () => {
      await productDetailPage.cartPanel.expectAdded();
    });
  });

  test('should not render an add-to-cart CTA when the product has no online-store method', async ({
    productDetailPage,
  }) => {
    await productDetailPage.gotoByCode(products.noOnlineStore);

    await expect(productDetailPage.addToCartButton).toHaveCount(0);
    await expect(productDetailPage.restockButton).toHaveCount(0);
  });

  test('should render a disabled add-to-cart button for an out-of-stock product without restock', async ({
    productDetailPage,
  }) => {
    await productDetailPage.gotoByCode(products.addCartDisabled);

    await expect(productDetailPage.disabledAddToCartButton.first()).toBeVisible();
    await expect(productDetailPage.disabledAddToCartButton.first()).toBeDisabled();
  });

  test('should render an enabled add-to-cart CTA on a multi-SKU product row', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.multiVariant);

    await test.step('Two cart rows render', async () => {
      await expect(productDetailPage.cartRows).toHaveCount(2);
    });

    await test.step('The add-to-cart row exposes an enabled CTA', async () => {
      await expect(productDetailPage.addToCartButton.first()).toBeVisible();
      await expect(productDetailPage.addToCartButton.first()).toBeEnabled();
    });
  });
});
