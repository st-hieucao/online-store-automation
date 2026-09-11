import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { ReviewItemComponent } from '@pages/components/review-item.component';

/** Minimal Page Object for `online-store-web/Pages/Products/Show.vue`.
 *  Scoped to the C46 review widget; extend as needed for other product-detail tests. */
export class ProductDetailPage {
  readonly page: Page;

  // C46 — no-review state
  readonly c46NoReview: Locator;
  readonly c46NoReviewText: Locator;
  readonly c46FirstPostLink: Locator;

  // C46 — has-review state
  readonly c46HasReview: Locator;
  readonly c46ReviewCountLink: Locator;
  readonly c46PostButton: Locator;
  readonly c46ReviewList: Locator;
  readonly c46ShowAllLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.c46NoReview = page.locator('section.review-section--no-review');
    this.c46NoReviewText = page.locator('.review-heading__no-review-text');
    this.c46FirstPostLink = page.locator('section.review-section--no-review a.review-button-post');

    this.c46HasReview = page.locator('section.review-section:not(.review-section--no-review)');
    this.c46ReviewCountLink = page.locator('.review-heading__number');
    this.c46PostButton = page.locator('section.review-section:not(.review-section--no-review) a.review-button-post');
    this.c46ReviewList = page.locator('.review-section__review-list');
    this.c46ShowAllLink = page.locator('.review-section__show-all a');
  }

  async goto(code: string): Promise<void> {
    await this.page.goto(`/${code}`);
    await expect(this.page).toHaveURL(new RegExp(`/${code}`));
  }

  c46ReviewItems(): Locator {
    return this.c46ReviewList.locator('li.review-item');
  }

  c46ReviewItemAt(index: number): ReviewItemComponent {
    return new ReviewItemComponent(this.c46ReviewItems().nth(index));
  }

  async expectC46Visible(): Promise<void> {
    await expect(
      this.page.locator('section.review-section, section.review-section--no-review').first(),
    ).toBeVisible();
  }

  async expectC46NoReviewState(itemCode: string): Promise<void> {
    await expect(this.c46NoReview).toBeVisible();
    await expect(this.c46NoReviewText).toContainText('最初のレビューを書いてみませんか？');
    await expect(this.c46FirstPostLink).toHaveAttribute('href', `/${itemCode}/review/create`);
  }

  async expectC46HasReviewState(itemCode: string): Promise<void> {
    await expect(this.c46HasReview).toBeVisible();
    await expect(this.c46ReviewCountLink).toBeVisible();
    await expect(this.c46ReviewCountLink).toHaveAttribute('href', `/${itemCode}/review`);
    await expect(this.c46PostButton).toBeVisible();
    await expect(this.c46ReviewItems().first()).toBeVisible();
    await expect(this.c46ShowAllLink).toHaveAttribute('href', `/${itemCode}/review`);
  }
}
