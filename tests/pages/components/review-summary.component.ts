import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { productDetailData } from '@test-data/product-detail.data';

/**
 * Wraps the product-detail review summary (`online-store-web/Pages/Products/childComponents/C46.vue`).
 * Renders two branches: an empty state (`.review-section--no-review`, reviewTotal === 0) with a
 * `0件のレビュー` link, and a populated state with a `{n}件` count link and a
 * `すべてのレビューを見る` see-all link. Both link to `/{item_code}/review`. Only renders for
 * review-eligible categories (beans/tealeaf/tumblermug/goods/brewing). No `data-testid`.
 */
export class ReviewSummaryComponent {
  readonly root: Locator;
  readonly emptyState: Locator;
  readonly stars: Locator;
  readonly points: Locator;
  readonly countLink: Locator;
  readonly seeAllLink: Locator;
  readonly emptyReviewsLink: Locator;

  constructor(page: Page) {
    this.root = page.locator('.review-section');
    this.emptyState = page.locator('.review-section--no-review');
    this.stars = this.root.locator('.review-evaluation__stars');
    this.points = this.root.locator('.review-evaluation__points');
    this.countLink = this.root.locator('.review-heading__number');
    this.seeAllLink = this.root.getByRole('link', { name: productDetailData.text.seeAllReviews });
    this.emptyReviewsLink = this.root.getByRole('link', { name: productDetailData.text.emptyReviewsLink });
  }

  async isEmptyState(): Promise<boolean> {
    return (await this.emptyState.count()) > 0;
  }

  /** Star widget always renders (rating 0 in the empty branch), so it's a reliable presence check. */
  async expectRendered(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.stars).toBeVisible();
  }

  /** The link into the full review list differs by branch (empty vs populated). */
  reviewListLink(isEmpty: boolean): Locator {
    return isEmpty ? this.emptyReviewsLink : this.seeAllLink;
  }

  /** A review count is shown in both branches: `0件のレビュー` (empty) or `{n}件` (populated). */
  async expectCountVisible(): Promise<void> {
    const isEmpty = await this.isEmptyState();
    const countTarget = isEmpty ? this.emptyReviewsLink : this.countLink;

    await expect(countTarget.first()).toBeVisible();
  }
}
