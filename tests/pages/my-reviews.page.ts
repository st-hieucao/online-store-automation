import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { PaginationComponent } from '@pages/components/pagination.component';

export class MyReviewsPage {
  readonly page: Page;
  readonly root: Locator;
  readonly heading: Locator;
  readonly reviewCount: Locator;
  readonly tabArea: Locator;
  readonly reviewList: Locator;
  readonly emptyState: Locator;
  readonly emptySearchButton: Locator;
  readonly deleteSuccessModal: Locator;
  readonly header: Locator;
  readonly footer: Locator;
  readonly pagination: PaginationComponent;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('.myreview-page');
    this.heading = page.locator('h1.myreview-title');
    this.reviewCount = page.locator('.myreview-number');
    this.tabArea = page.locator('.myreview-page__tab-area');
    this.reviewList = page.locator('ul.myreview-list');
    this.emptyState = page.locator('.myreview-page__no-review');
    this.emptySearchButton = page.locator('.myreview-page__search-coffee');
    this.deleteSuccessModal = page.locator('.confirm-modal__main--complete');
    this.header = page.locator('header.globalNav');
    this.footer = page.locator('footer.footerWrap');
    this.pagination = new PaginationComponent(page);
  }

  async goto(query?: Record<string, string>): Promise<void> {
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
    await this.page.goto(`/mystarbucks/review${queryString}`);
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/mystarbucks\/review/);
    await expect(this.root).toBeVisible();
    await expect(this.heading).toBeVisible();
  }

  async clickTab(label: string): Promise<void> {
    await this.tabArea.getByText(label).click();
  }

  async expectSortParam(value: string): Promise<void> {
    await expect.poll(() => new URL(this.page.url()).searchParams.get('sort')).toBe(value);
  }

  reviewItems(): Locator {
    return this.reviewList.locator('li.myreview-list__item');
  }

  reviewItemAt(index: number): Locator {
    return this.reviewItems().nth(index);
  }

  async expectItemContent(index: number): Promise<void> {
    const item = this.reviewItemAt(index);
    await expect(item.locator('.myreview-item__date__text')).not.toBeEmpty();
    await expect(item.locator('.myreview-item__name-link')).not.toBeEmpty();
    await expect(item.locator('.myreview-item__stars')).toBeVisible();
    await expect(item.locator('.myreview-item__title')).not.toBeEmpty();
    await expect(item.locator('.myreview-item__text')).not.toBeEmpty();
  }

  async clickItemImage(item: Locator, options?: { force?: boolean }): Promise<void> {
    await item.locator('.myreview-item__image').click({ force: options?.force });
  }

  async expectItemImageSrc(index: number, pattern: RegExp): Promise<void> {
    const img = this.reviewItemAt(index).locator('.myreview-item__image img');
    await expect(img).toHaveAttribute('src', pattern);
  }

  async expectItemImageNoSrc(item: Locator): Promise<void> {
    await expect(item.locator('.myreview-item__image')).toHaveClass(/prevent-click/);
  }

  async findOnSaleItemAcrossPages(maxPages = 5): Promise<{ item: Locator; index: number } | null> {
    await this.goto();
    const lastPage = Number(await this.pagination.lastPageValue());
    const limit = Math.min(maxPages, lastPage);
    for (let p = 1; p <= limit; p++) {
      if (p > 1) await this.goto({ page: String(p) });
      const items = this.reviewItems();
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        const cls = await items.nth(i).locator('.myreview-item__image').getAttribute('class').catch(() => '');
        if (!cls?.includes('prevent-click')) return { item: items.nth(i), index: i };
      }
    }
    return null;
  }

  async clickEdit(index: number): Promise<void> {
    await this.reviewItemAt(index).locator('.myreview-item__button--helpful').click();
  }

  async clickDelete(index: number): Promise<void> {
    await this.reviewItemAt(index).locator('.myreview-item__button--delete').click();
  }

  async expectDeleteModal(): Promise<void> {
    await expect(this.page.locator('.confirm-modal__main')).toBeVisible();
    await expect(this.page.locator('.confirm-modal__main')).toContainText('このレビューを削除しますか？');
  }

  async confirmDelete(): Promise<void> {
    const modal = this.page.locator('.confirm-modal__main');
    const currentUrl = this.page.url();
    const navPromise = this.page.waitForURL((url) => url.href !== currentUrl, { waitUntil: 'commit' });
    await modal.getByRole('button', { name: 'はい' }).click();
    await navPromise;
  }

  async expectDeleteSuccessModal(): Promise<void> {
    await expect(this.deleteSuccessModal).toBeVisible();
  }

  async dismissDeleteSuccessModal(): Promise<void> {
    await this.deleteSuccessModal.getByRole('button', { name: '戻る' }).click();
    await expect(this.deleteSuccessModal).toHaveCount(0);
  }

  async totalReviewCount(): Promise<number> {
    const text = await this.reviewCount.innerText();
    return parseInt(text.replace(/[^0-9]/g, ''), 10);
  }

  async expectTotalReviewCount(expected: number): Promise<void> {
    await expect.poll(() => this.totalReviewCount()).toBe(expected);
  }

  async expectReviewCount(count: number): Promise<void> {
    await expect(this.reviewItems()).toHaveCount(count);
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
    await expect(this.emptySearchButton).toBeVisible();
  }

  async expectPageParam(value: string): Promise<void> {
    await expect.poll(() => new URL(this.page.url()).searchParams.get('page')).toBe(value);
  }

  async expectDateFormat(index: number, format: RegExp): Promise<void> {
    await expect(this.reviewItemAt(index).locator('.myreview-item__date__text')).toHaveText(format);
  }

  async noImageItems(): Promise<Locator[]> {
    const items = this.reviewItems();
    const count = await items.count();
    const result: Locator[] = [];
    for (let i = 0; i < count; i++) {
      const cls = await items.nth(i).locator('.myreview-item__image').getAttribute('class').catch(() => '');
      if (cls?.includes('prevent-click')) result.push(items.nth(i));
    }
    return result;
  }

  async findNoImageItemAcrossPages(maxPages = 5): Promise<Locator | null> {
    await this.goto();
    const lastPage = Number(await this.pagination.lastPageValue());
    const limit = Math.min(maxPages, lastPage);

    for (let p = 1; p <= limit; p++) {
      if (p > 1) await this.goto({ page: String(p) });
      const found = await this.noImageItems();
      if (found.length > 0) return found[0]!;
    }
    return null;
  }
}
