import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Wraps the three review authoring pages:
 *  - ReviewForm (form step)  — `/{jan_code}/review/create` or edit
 *  - ReviewConfirm (#confirm step)
 *  - CompleteReview           — `/{jan_code}/review/create/complete` or edit/complete
 */
export class ReviewFormPage {
  readonly page: Page;

  // Form step
  readonly formRoot: Locator;
  readonly formTitle: Locator;
  readonly starsContainer: Locator;
  readonly titleTextarea: Locator;
  readonly contentTextarea: Locator;
  readonly nicknameSection: Locator;
  readonly nicknameRegisterLink: Locator;
  readonly submitButton: Locator;
  readonly backButton: Locator;

  // Confirm step
  readonly confirmRoot: Locator;
  readonly confirmTitle: Locator;
  readonly confirmTexts: Locator;
  readonly confirmSubmitButton: Locator;
  readonly confirmBackButton: Locator;

  // Complete page
  readonly completeRoot: Locator;
  readonly completeTitle: Locator;
  readonly myReviewsLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.formRoot = page.locator('.review-post-page:not(.review-confirm-page)');
    this.formTitle = page.locator('.review-post-page:not(.review-confirm-page) h1.review-post-title');
    this.starsContainer = page.locator('.review-post-item__stars');
    this.titleTextarea = page.locator('textarea#review-post-title');
    this.contentTextarea = page.locator('textarea#review-post-text');
    this.nicknameSection = page.locator('.review-post-item--name, .review-post-item--no-name');
    this.nicknameRegisterLink = page.locator('a.name-register-button');
    this.submitButton = page.locator('.review-post-page:not(.review-confirm-page) button.review-post-button-submit');
    this.backButton = page.locator('.review-post-page:not(.review-confirm-page) button.review-post-button-return');

    this.confirmRoot = page.locator('.review-confirm-page');
    this.confirmTitle = page.locator('.review-confirm-page h1.review-post-title');
    this.confirmTexts = page.locator('.review-post-item__confirm-text');
    this.confirmSubmitButton = page.locator('.review-confirm-page button.review-post-button-submit');
    this.confirmBackButton = page.locator('.review-confirm-page button.review-post-button-return');

    this.completeRoot = page.locator('.review-post-complete-page');
    this.completeTitle = page.locator('h1.review-post-complete-title');
    this.myReviewsLink = page.locator('a.myreview-link');
  }

  async gotoCreate(code: string): Promise<void> {
    await this.page.goto(`/${code}/review/create`);
    await expect(this.formRoot).toBeVisible();
  }

  async gotoEdit(editPath: string): Promise<void> {
    await this.page.goto(editPath);
    await expect(this.formRoot).toBeVisible();
  }

  async selectStars(count: 1 | 2 | 3 | 4 | 5): Promise<void> {
    await this.starsContainer.locator('span').nth(count - 1).click();
  }

  async fillTitle(text: string): Promise<void> {
    await this.titleTextarea.fill(text);
    await this.titleTextarea.blur();
  }

  async fillContent(text: string): Promise<void> {
    await this.contentTextarea.fill(text);
    await this.contentTextarea.blur();
  }

  async fillForm(opts: { stars?: 1 | 2 | 3 | 4 | 5; title: string; content: string }): Promise<void> {
    if (opts.stars) await this.selectStars(opts.stars);
    await this.fillTitle(opts.title);
    await this.fillContent(opts.content);
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
    await this.page.waitForURL(/#confirm/);
  }

  async expectSubmitEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectConfirmStep(opts: { title: string; content: string }): Promise<void> {
    await expect(this.confirmRoot).toBeVisible();
    await expect(this.confirmTitle).toHaveText('レビュー内容確認');
    const texts = await this.confirmTexts.allInnerTexts();
    expect(texts.some((t) => t.includes(opts.title))).toBe(true);
    expect(texts.some((t) => t.includes(opts.content))).toBe(true);
  }

  async clickConfirmBack(): Promise<void> {
    const currentUrl = this.page.url();
    await this.confirmBackButton.click();
    await this.page.waitForURL((url) => url.href !== currentUrl);
  }

  async submitFromConfirm(): Promise<void> {
    const currentUrl = this.page.url();
    await this.confirmSubmitButton.click();
    await this.page.waitForURL((url) => url.href !== currentUrl);
  }

  async expectCompletePage(isEdit = false): Promise<void> {
    await expect(this.completeRoot).toBeVisible();
    await expect(this.completeTitle).toHaveText(
      isEdit ? 'レビュー編集完了' : 'レビュー投稿完了',
    );
  }

  async titleCharCount(): Promise<number> {
    const text = await this.page.locator('.review-post-item--title .word-count__num').innerText();
    return parseInt(text.trim(), 10) || 0;
  }

  async contentCharCount(): Promise<number> {
    const text = await this.page.locator('.review-post-item--text .word-count__num').innerText();
    return parseInt(text.trim(), 10) || 0;
  }
}
