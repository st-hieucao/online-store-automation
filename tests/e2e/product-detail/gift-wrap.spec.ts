import { test, expect } from '@fixtures/test-base';
import { productDetailData } from '@test-data/product-detail.data';
import { testTags } from '@utils/test-tags';

const { products, giftBoxOptions } = productDetailData;

/**
 * Giftbox / Noshi pulldown detail + the Noshi eligibility icon + guest add-cart with a wrap option
 * (manual "Add Cart function" sheet, no-login rows). Both pulldowns are page-body `CustomSelect`
 * widgets (`utils/selectBox.js`) — driven by clicking the trigger then an option span, not
 * `selectOption()`. Uses pinned staging products; guest add-cart (no discount_code) succeeds without
 * login. Deferred (documented in the plan): giftbox-inventory=0 disable (shared stocked box SKU),
 * 18-option noshi (no fixture), Partner-page pulldowns (401 for guests).
 */
test.describe(`Product Detail | Gift wrap ${testTags.regression}`, () => {
  test('should render both giftbox options enabled for an in-stock gift product', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.giftBox);

    await productDetailPage.giftBoxSelect.expectVisible();
    await productDetailPage.giftBoxSelect.open();

    await expect(productDetailPage.giftBoxSelect.options).toHaveCount(2);
    await expect(
      productDetailPage.giftBoxSelect.options.filter({ hasText: giftBoxOptions.without }),
    ).toBeVisible();
    await expect(
      productDetailPage.giftBoxSelect.options.filter({ hasText: giftBoxOptions.with }),
    ).toBeVisible();
    // In-stock gift-box SKU → the ボックスあり option is not disabled.
    await expect(productDetailPage.giftBoxSelect.root.locator('.custom-select__option.disabled')).toHaveCount(0);
  });

  test('should reflect the chosen giftbox option in the pulldown trigger', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.giftBox);

    await productDetailPage.giftBoxSelect.selectByText(giftBoxOptions.with);
    await expect(productDetailPage.giftBoxSelect.trigger).toContainText(giftBoxOptions.with);
  });

  test('should render selectable noshi options for a noshi-eligible product', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.noshi);

    await productDetailPage.noshiSelect.expectVisible();

    const options = await productDetailPage.noshiSelect.optionTexts();

    expect(options.length).toBeGreaterThan(1);
    // First option is always 包装なし (convertNoshiList).
    expect(options).toContain('包装なし');

    const secondOption = options[1];

    expect(secondOption).toBeTruthy();
    await productDetailPage.noshiSelect.selectByText(secondOption as string);
  });

  test('should show the noshi icon only for a noshi-eligible product', async ({ productDetailPage }) => {
    await test.step('Noshi-eligible product shows the 包装・のし対象 icon', async () => {
      await productDetailPage.gotoByCode(products.noshi);
      await expect(productDetailPage.noshiIcon).toBeVisible();
    });

    await test.step('A product with no noshi does not show the icon', async () => {
      await productDetailPage.gotoByCode(products.noNoshi);
      await expect(productDetailPage.noshiIcon).toHaveCount(0);
    });
  });

  test(`should add to cart after choosing a giftbox option as a guest ${testTags.smoke}`, async ({
    productDetailPage,
  }) => {
    await productDetailPage.gotoByCode(products.giftBox);

    await productDetailPage.expectAddedWithGiftBox(giftBoxOptions.with);
  });

  test('should add to cart after choosing a noshi option as a guest', async ({ productDetailPage }) => {
    await productDetailPage.gotoByCode(products.noshi);

    const options = await productDetailPage.noshiSelect.optionTexts();
    const secondOption = options[1];

    expect(secondOption).toBeTruthy();
    await productDetailPage.expectAddedWithNoshi(secondOption as string);
  });
});
