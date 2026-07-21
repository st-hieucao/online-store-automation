import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Wraps the page-body custom select widget (`online-store-web/components/partials/CustomSelect.vue`
 * + `utils/selectBox.js`). On mount, the native `<select class="origin-select">` is hidden and a JS
 * widget is built next to it: a `.custom-select__trigger` span plus `.custom-select__option` spans.
 * Playwright's `selectOption()` does NOT drive this widget — you must click the trigger, then click
 * the matching option span. Used for the page-body quantity / gift-box / noshi selectors in
 * `ItemC20C21.vue` (classes `select--S` / `select--giftbox` / `select--wrapping`).
 */
export class CustomSelectComponent {
  readonly root: Locator;
  readonly trigger: Locator;
  readonly options: Locator;

  /**
   * `rootClass` is the `CustomSelect` `class-name`, e.g. `select--S`, `select--giftbox`. Scoped to
   * `.custom-select-wrap` because the multi-variant overlay reuses the same `select--*` class on its
   * native `.selectbox-wrap` select — matching bare `.select--*` would resolve to both.
   */
  constructor(page: Page, rootClass: string) {
    this.root = page.locator(`.custom-select-wrap.${rootClass}`);
    this.trigger = this.root.locator('.custom-select__trigger');
    this.options = this.root.locator('.custom-select__option');
  }

  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async open(): Promise<void> {
    await this.trigger.click();
    await expect(this.root.locator('.custom-select')).toHaveClass(/opened/);
  }

  /** Opens the widget and clicks the option whose visible text matches `label`. */
  async selectByText(label: string): Promise<void> {
    await this.open();
    await this.options.filter({ hasText: label }).first().click();
    await expect(this.trigger).toContainText(label);
  }

  async triggerText(): Promise<string> {
    return (await this.trigger.textContent())?.trim() ?? '';
  }

  async optionTexts(): Promise<string[]> {
    return (await this.options.allTextContents()).map(text => text.trim());
  }
}
