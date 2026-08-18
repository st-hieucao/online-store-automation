import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/** Wraps `online-store-web/Pages/Reviews/partials/ReviewItem.vue` (`li.review-item`).
 *  Used in both ReviewList and C46. */
export class ReviewItemComponent {
  readonly root: Locator;
  readonly stars: Locator;
  readonly date: Locator;
  readonly title: Locator;
  readonly content: Locator;
  readonly seeMoreButton: Locator;
  readonly reviewerName: Locator;
  readonly likeButton: Locator;
  readonly reportButton: Locator;

  constructor(root: Locator) {
    this.root = root;
    this.stars = root.locator('.review-item__stars');
    this.date = root.locator('.review-item__date');
    this.title = root.locator('h4.review-item__title');
    this.content = root.locator('p.review-item__text');
    this.seeMoreButton = root.locator('button.review-button-more');
    this.reviewerName = root.locator('.review-item__user');
    this.likeButton = root.locator('button.review-button-helpful');
    this.reportButton = root.locator('button.review-button-report');
  }

  async likeCount(): Promise<number> {
    const text = await this.likeButton.locator('.review-button-helpful__number').innerText();
    return parseInt(text.trim(), 10) || 0;
  }

  async clickLike(): Promise<void> {
    await this.likeButton.click();
  }

  async isLiked(): Promise<boolean> {
    const classes = await this.likeButton.getAttribute('class');
    return classes?.includes('active') ?? false;
  }

  async expectLikeCount(count: number): Promise<void> {
    await expect(this.likeButton.locator('.review-button-helpful__number')).toHaveText(
      String(count),
    );
  }

  async expectContent(): Promise<void> {
    await expect(this.stars).toBeVisible();
    await expect(this.date).not.toBeEmpty();
    await expect(this.title).not.toBeEmpty();
    await expect(this.content).not.toBeEmpty();
    await expect(this.reviewerName).not.toBeEmpty();
  }
}
