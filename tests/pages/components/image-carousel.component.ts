import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Wraps the product image carousel (`online-store-web/Pages/Products/childComponents/C01.vue`,
 * enhanced by `utils/productDetail.js`). Each product image is an `.image-carousel__item`; the
 * shown one carries `.active`. On desktop (Playwright's default viewport) navigation happens by
 * clicking a nav item — the `.arrow-button--prev/--next` controls are SP-only and injected inside
 * the `.zoom-area`. No `data-testid` exists, so locators use these stable structural classes.
 */
export class ImageCarouselComponent {
  readonly root: Locator;
  readonly items: Locator;
  readonly activeItem: Locator;

  constructor(page: Page) {
    this.root = page.locator('.image-carousel');
    this.items = this.root.locator('.image-carousel__item');
    this.activeItem = this.root.locator('.image-carousel__item.active');
  }

  async imageCount(): Promise<number> {
    return this.items.count();
  }

  /** The carousel always renders one active slide with a real image `src`. */
  async expectHasActiveImage(): Promise<void> {
    await expect(this.activeItem).toHaveCount(1);
    const src = await this.activeItem.locator('img').first().getAttribute('src');

    expect(src?.trim()).toBeTruthy();
  }

  /** Clicks the nav item at `index` (desktop navigation) and asserts it becomes the active slide. */
  async expectItemBecomesActive(index: number): Promise<void> {
    const target = this.items.nth(index);

    await target.click();
    await expect(target).toHaveClass(/active/);
  }
}
