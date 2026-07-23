import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { productDetailData } from '@test-data/product-detail.data';

/**
 * Wraps the multi-variant selection overlay (`online-store-web/Pages/Products/childComponents/
 * MultipleProduct.vue`), opened by the floating `.js-float-product-selection` button on multi-SKU
 * products. The panel exists in the DOM but only gains `.show` once opened. Each
 * `ItemMultipleProduct` row has a native `<select class="selectbox">` quantity control (so
 * `selectOption()` works here, unlike the page-body `CustomSelect`) and its own `カートに入れる`
 * button. No `data-testid`.
 */
export class ProductSelectionComponent {
  readonly root: Locator;
  readonly title: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.root = page.locator('.float-product-selection');
    this.title = this.root.locator('.float-product-selection__heading__title');
    this.rows = this.root.locator('.float-product-selection__list__item');
  }

  async expectOpen(): Promise<void> {
    await expect(this.root).toHaveClass(/show/);
    await expect(this.title).toHaveText(productDetailData.text.selectProductType);
  }

  row(index: number): Locator {
    return this.rows.nth(index);
  }

  /** Native `<select class="selectbox">` inside a row — driveable with `selectOption`. */
  async selectRowQuantity(index: number, value: string): Promise<void> {
    await this.row(index).locator('select.selectbox').selectOption(value);
  }

  async addRowToCart(index: number): Promise<void> {
    await this.row(index).getByRole('button', { name: productDetailData.text.addToCart }).click();
  }
}
