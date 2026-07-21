import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { productDetailData } from '@test-data/product-detail.data';

/**
 * Wraps the "added to cart" confirmation panel (`online-store-web/Pages/Products/childComponents/
 * QuickCart.vue`). `.float-cart` gains `.show` once an item is added; it shows the product name,
 * SKU type, chosen quantity, and a `購入に進む` proceed link. No `data-testid`.
 */
export class CartPanelComponent {
  readonly root: Locator;
  readonly title: Locator;
  readonly productName: Locator;
  readonly productType: Locator;
  readonly quantity: Locator;
  readonly proceedLink: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.root = page.locator('.float-cart');
    this.title = this.root.locator('.float-cart__heading__title');
    this.productName = this.root.locator('.product-name');
    this.productType = this.root.locator('.product-type');
    this.quantity = this.root.locator('.product-quantity .num');
    this.proceedLink = page.getByRole('link', { name: productDetailData.text.proceedToCart });
    this.closeButton = this.root.locator('.close-button.js-float-close');
  }

  /** The panel is shown (`.show`) with the confirmation title once the add-to-cart POST resolves. */
  async expectAdded(): Promise<void> {
    await expect(this.root).toHaveClass(/show/);
    await expect(this.title).toHaveText(productDetailData.text.addedToCart);
    await expect(this.proceedLink).toBeVisible();
  }

  async quantityText(): Promise<string> {
    return (await this.quantity.textContent())?.trim() ?? '';
  }
}
