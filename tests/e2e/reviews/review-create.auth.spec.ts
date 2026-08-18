import { test, expect } from '@fixtures/test-base';
import { env } from '@config/env';
import { reviewData } from '@test-data/review.data';
import { testTags } from '@utils/test-tags';

const productCode = env.review.productCodeWithReviews;
const editPath = env.review.editPath;

test.describe(`Create Review flow ${testTags.regression}`, () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.skip(
      !productCode,
      'Set REVIEW_PRODUCT_CODE_WITH_REVIEWS in .env to run Create Review tests',
    );
  });

  test(`should show review form with correct title on create page ${testTags.smoke}`, async ({
    reviewFormPage,
  }) => {
    await reviewFormPage.gotoCreate(productCode!);

    await expect(reviewFormPage.formTitle).toHaveText(reviewData.formTitle.create);
    await expect(reviewFormPage.starsContainer).toBeVisible();
    await expect(reviewFormPage.titleTextarea).toBeVisible();
    await expect(reviewFormPage.contentTextarea).toBeVisible();
    await expect(reviewFormPage.nicknameSection).toBeVisible();
  });

  test('submit button is disabled before filling the form', async ({ reviewFormPage }) => {
    await reviewFormPage.gotoCreate(productCode!);

    await reviewFormPage.expectSubmitDisabled();
  });

  test('submit button remains disabled when no stars are selected', async ({
    reviewFormPage,
  }) => {
    await reviewFormPage.gotoCreate(productCode!);

    await test.step('Fill title and content (no stars)', async () => {
      await reviewFormPage.fillTitle(reviewData.form.valid.title);
      await reviewFormPage.fillContent(reviewData.form.valid.content);
    });

    await test.step('Submit button stays disabled without a star rating', async () => {
      await reviewFormPage.expectSubmitDisabled();
    });
  });

  test('submit button is disabled when title exceeds 50 characters', async ({
    reviewFormPage,
  }) => {
    await reviewFormPage.gotoCreate(productCode!);

    await test.step('Fill all fields with an oversized title', async () => {
      await reviewFormPage.selectStars(5);
      await reviewFormPage.fillTitle(reviewData.form.invalid.titleTooLong);
      await reviewFormPage.fillContent(reviewData.form.valid.content);
    });

    await test.step('Submit button is disabled', async () => {
      await reviewFormPage.expectSubmitDisabled();
    });

    await test.step('Character count exceeds 50', async () => {
      const count = await reviewFormPage.titleCharCount();
      expect(count).toBeGreaterThan(50);
    });
  });

  test('submit button is disabled when content is shorter than 25 characters', async ({
    reviewFormPage,
  }) => {
    await reviewFormPage.gotoCreate(productCode!);

    await test.step('Fill all fields with short content', async () => {
      await reviewFormPage.selectStars(5);
      await reviewFormPage.fillTitle(reviewData.form.valid.title);
      await reviewFormPage.fillContent(reviewData.form.invalid.contentTooShort);
    });

    await test.step('Submit button is disabled', async () => {
      await reviewFormPage.expectSubmitDisabled();
    });
  });

  test('submit button is disabled when content exceeds 400 characters', async ({
    reviewFormPage,
  }) => {
    await reviewFormPage.gotoCreate(productCode!);

    await test.step('Fill all fields with oversized content', async () => {
      await reviewFormPage.selectStars(5);
      await reviewFormPage.fillTitle(reviewData.form.valid.title);
      await reviewFormPage.fillContent(reviewData.form.invalid.contentTooLong);
    });

    await test.step('Submit button is disabled', async () => {
      await reviewFormPage.expectSubmitDisabled();
    });
  });

  test(`happy path: valid form → confirm screen shows entered data correctly ${testTags.smoke}`, async ({
    reviewFormPage,
  }) => {
    await reviewFormPage.gotoCreate(productCode!);

    await test.step('Fill the form with valid data', async () => {
      await reviewFormPage.fillForm({
        stars: 5,
        title: reviewData.form.valid.title,
        content: reviewData.form.valid.content,
      });
    });

    await test.step('Submit button is enabled', async () => {
      await reviewFormPage.expectSubmitEnabled();
    });

    await test.step('Click "内容確認へ" — URL gains #confirm', async () => {
      await reviewFormPage.clickSubmit();
    });

    await test.step('Confirm screen shows correct title and entered data', async () => {
      await reviewFormPage.expectConfirmStep({
        title: reviewData.form.valid.title,
        content: reviewData.form.valid.content,
      });
    });
  });

  test('"入力画面へ戻る" from confirm returns to the form URL', async ({
    reviewFormPage,
    page,
  }) => {
    await reviewFormPage.gotoCreate(productCode!);

    await test.step('Fill form and advance to confirm step', async () => {
      await reviewFormPage.fillForm({
        stars: 4,
        title: reviewData.form.valid.title,
        content: reviewData.form.valid.content,
      });
      await reviewFormPage.clickSubmit();
      await expect(reviewFormPage.confirmRoot).toBeVisible();
    });

    await test.step('Click "入力画面へ戻る"', async () => {
      await reviewFormPage.clickConfirmBack();
    });

    await test.step('URL no longer has #confirm', async () => {
      await expect(page).not.toHaveURL(/#confirm/);
    });
  });

  // Actual POST to the server is a mutating operation — skipped to avoid accumulating test reviews.
  // To test the complete page manually: fill the form, submit from confirm, and verify
  // the URL ends with /review/create/complete and the title reads 'レビュー投稿完了'.
});

test.describe(`Edit Review flow ${testTags.regression}`, () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.skip(
      !editPath,
      'Set REVIEW_EDIT_PATH (e.g. /jan_code/review/review_code/edit) in .env to run Edit tests',
    );
  });

  test('should pre-fill the form with existing review data on the edit page', async ({
    reviewFormPage,
  }) => {
    await reviewFormPage.gotoEdit(editPath!);

    await test.step('Page title is "レビュー編集"', async () => {
      await expect(reviewFormPage.formTitle).toHaveText(reviewData.formTitle.edit);
    });

    await test.step('Title textarea is pre-filled', async () => {
      const titleValue = await reviewFormPage.titleTextarea.inputValue();
      expect(titleValue.length).toBeGreaterThan(0);
    });

    await test.step('Content textarea is pre-filled', async () => {
      const contentValue = await reviewFormPage.contentTextarea.inputValue();
      expect(contentValue.length).toBeGreaterThan(0);
    });
  });

  test(`should show "レビュー内容確認" on confirm step for edit ${testTags.smoke}`, async ({
    reviewFormPage,
  }) => {
    await reviewFormPage.gotoEdit(editPath!);

    await test.step('Star rating, title, content are already filled — enable submit', async () => {
      await reviewFormPage.expectSubmitEnabled();
    });

    await test.step('Click "内容確認へ" and verify confirm step', async () => {
      await reviewFormPage.clickSubmit();
      await expect(reviewFormPage.confirmRoot).toBeVisible();
      await expect(reviewFormPage.confirmTitle).toHaveText(reviewData.formTitle.confirm);
    });
  });
});

test.describe(`Create Review — no nickname ${testTags.regression}`, () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.skip(
      !productCode,
      'Set REVIEW_PRODUCT_CODE_WITH_REVIEWS in .env to run nickname tests',
    );
  });

  test('should disable submit and show nickname register link when account has no nickname', async ({
    reviewFormPage,
  }) => {
    await reviewFormPage.gotoCreate(productCode!);

    const noNicknameSection = reviewFormPage.page.locator('.review-post-item--no-name');
    test.skip(
      !(await noNicknameSection.isVisible()),
      'Test account has a nickname set — skip no-nickname state test',
    );

    await test.step('Submit button is disabled', async () => {
      await reviewFormPage.expectSubmitDisabled();
    });

    await test.step('Nickname register link is visible', async () => {
      await expect(reviewFormPage.nicknameRegisterLink).toBeVisible();
    });
  });
});
