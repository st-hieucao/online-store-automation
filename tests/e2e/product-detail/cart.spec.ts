import { test, expect } from '@fixtures/test-base';
import { productDetailData } from '@test-data/product-detail.data';
import { testTags } from '@utils/test-tags';

const { products, text, giftBoxOptions } = productDetailData;

/**
 * These tests reach specific product types via pinned staging codes (see
 * `productDetailData.products`) because the CTA state depends on SKU count / stock / gift flags that
 * navigate-from-search can't guarantee. Add-to-cart POSTs to the real cart service keyed by an
 * anonymous `visitor_code` cookie, so each fresh test context starts with an empty guest cart — no
 * ordering dependency and no cleanup needed.
 */
test.describe(`Product Detail | Cart ${testTags.regression}`, () => {
  test(`should add a single-SKU product to the cart ${testTags.smoke}`, async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.singleSku);

    await expect(productDetailPage.addToCartButton.first()).toBeVisible();
    await productDetailPage.addToCartButton.first().click();

    await productDetailPage.cartPanel.expectAdded();
    await expect(productDetailPage.cartPanel.productName).not.toBeEmpty();
  });

  test(`should add a variant of a multi-SKU product to the cart ${testTags.smoke}`, async ({
    productDetailPage,
  }) => {
    await productDetailPage.gotoByCode(products.multiVariant);

    await test.step('A multi-SKU product renders one cart row per variant', async () => {
      await expect(productDetailPage.cartRows).toHaveCount(2);
    });

    await test.step('Add the first add-to-cart variant and see the confirmation', async () => {
      await productDetailPage.addToCartButton.first().click();
      await productDetailPage.cartPanel.expectAdded();
    });
  });

  test('should render a quantity selector on each variant row', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.multiVariant);

    // A multi-SKU product renders two cart rows (ItemC20C21), each with its own quantity
    // CustomSelect (`.select--S`).
    await expect(productDetailPage.cartRows).toHaveCount(2);
    await expect(productDetailPage.page.locator('.custom-select-wrap.select--S')).toHaveCount(2);
  });

  test('should reflect the chosen quantity in the cart confirmation', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.singleSku);

    await test.step('Change quantity to 2 via the custom-select widget', async () => {
      await productDetailPage.quantitySelect.selectByText('2');
    });

    await test.step('Add to cart and verify the confirmation shows quantity 2', async () => {
      await productDetailPage.addToCartButton.first().click();
      await productDetailPage.cartPanel.expectAdded();
      await expect(productDetailPage.cartPanel.quantity).toHaveText('2');
    });
  });

  test('should show the restock CTA instead of add-to-cart for an out-of-stock product', async ({
    productDetailPage,
  }) => {
    await productDetailPage.gotoByCode(products.outOfStock);

    await expect(productDetailPage.restockButton.first()).toBeVisible();
    await expect(productDetailPage.restockButton.first()).toHaveText(text.restockNotice);
    await expect(productDetailPage.addToCartButton).toHaveCount(0);
  });

  test('should render a selectable gift-box option for a gift-eligible product', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.giftBox);

    await productDetailPage.giftBoxSelect.expectVisible();
    await productDetailPage.giftBoxSelect.selectByText(giftBoxOptions.with);
  });

  test('should render a selectable noshi option for a noshi-eligible product', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.noshi);

    await productDetailPage.noshiSelect.expectVisible();

    const options = await productDetailPage.noshiSelect.optionTexts();

    expect(options.length).toBeGreaterThan(1);

    const secondOption = options[1];

    expect(secondOption).toBeTruthy();
    await productDetailPage.noshiSelect.selectByText(secondOption as string);
  });
});
