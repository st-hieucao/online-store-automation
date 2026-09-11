import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { ReviewItemComponent } from '@pages/components/review-item.component';
import { SortSelectComponent } from '@pages/components/sort-select.component';

/** Wraps `online-store-web/Pages/Reviews/ReviewList.vue` (`/{jan_code}/review`). */
export class ReviewListPage {
  readonly page: Page;
  readonly root: Locator;
  readonly pageTitle: Locator;
  readonly productName: Locator;
  readonly productImageLink: Locator;
  readonly ratingStar: Locator;
  readonly postButton: Locator;
  readonly reviewList: Locator;
  readonly noReviewText: Locator;
  readonly sortSelect: SortSelectComponent;
  readonly pagination: {
    root: Locator;
    prevButton: Locator;
    nextButton: Locator;
    select: Locator;
  };

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('.review-list-page');
    this.pageTitle = page.locator('h1.review-list-title');
    this.productName = page.locator('.review-product__name a.review-product__link');
    this.productImageLink = page.locator('a.review-product__image');
    this.ratingStar = page.locator('.review-product__evaluation .review-evaluation__stars');
    this.postButton = page.locator('a.review-button-post').first();
    this.reviewList = page.locator('ul.review-list');
    this.noReviewText = page.locator('.review-heading__no-review-text');
    this.sortSelect = new SortSelectComponent(page);
    this.pagination = {
      root: page.locator('.review-list-pager'),
      prevButton: page.locator('.review-list-pager__button').first(),
      nextButton: page.locator('.review-list-pager__button').last(),
      select: page.locator('select#review-list-pager-selectbox'),
    };
  }

  async goto(code: string, query?: Record<string, string>): Promise<void> {
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
    await this.page.goto(`/${code}/review${queryString}`);
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.pageTitle).toBeVisible();
  }

  reviewItems(): Locator {
    return this.reviewList.locator('li.review-item');
  }

  reviewItemAt(index: number): ReviewItemComponent {
    return new ReviewItemComponent(this.reviewItems().nth(index));
  }

  async expectSortParam(value: string): Promise<void> {
    await expect
      .poll(() => new URL(this.page.url()).searchParams.get('sort'))
      .toBe(value || null);
  }

  async expectPaginationPrevDisabled(): Promise<void> {
    await expect(this.pagination.prevButton).toHaveClass(/disabled/);
  }

  async expectPaginationNextDisabled(): Promise<void> {
    await expect(this.pagination.nextButton).toHaveClass(/disabled/);
  }

  async expectCurrentPage(value: string): Promise<void> {
    await expect(this.pagination.select).toHaveValue(value);
  }

  async lastPageValue(): Promise<string> {
    const options = this.pagination.select.locator('option');
    const count = await options.count();
    return (await options.nth(count - 1).getAttribute('value')) ?? '1';
  }

  async goToNextPage(): Promise<void> {
    const currentUrl = this.page.url();
    await this.pagination.nextButton.click();
    await this.page.waitForURL((url) => url.href !== currentUrl);
  }

  async goToPrevPage(): Promise<void> {
    const currentUrl = this.page.url();
    await this.pagination.prevButton.click();
    await this.page.waitForURL((url) => url.href !== currentUrl);
  }
}
