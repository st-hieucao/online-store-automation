import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Shared breadcrumb trail (`online-store-web/components/partials/Breadcrumbs.vue`), reusable across
 * Product Detail / Search / ETicket / Partner. The last crumb is a non-link `span.current`; earlier
 * crumbs are `<a>` links, the first being the `Home` link. No `data-testid`, so locators rely on the
 * semantic `.breadcrumb` structure.
 */
export class BreadcrumbsComponent {
  readonly root: Locator;
  readonly items: Locator;
  readonly current: Locator;
  readonly homeLink: Locator;

  constructor(page: Page) {
    this.root = page.locator('.breadcrumb-wrap .breadcrumb');
    this.items = this.root.locator('li');
    this.current = this.root.locator('.current');
    this.homeLink = this.root.getByRole('link').first();
  }

  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async expectHomeLink(name: string): Promise<void> {
    await expect(this.homeLink).toHaveText(name);
    const href = await this.homeLink.getAttribute('href');

    expect(href?.trim()).toBeTruthy();
  }

  async currentText(): Promise<string> {
    return (await this.current.last().textContent())?.trim() ?? '';
  }
}
