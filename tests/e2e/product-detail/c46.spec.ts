import { test, expect } from '@fixtures/test-base';
import { env } from '@config/env';
import { reviewData } from '@test-data/review.data';
import { testTags } from '@utils/test-tags';

const productWithReviews = env.review.productCodeWithReviews;
const productNoReviews = env.review.productCodeNoReviews;

test.describe(`C46 — Review widget on Product Detail ${testTags.regression}`, () => {
  test.describe('C46 renders on applicable category product', () => {
    test.beforeEach(async ({}, testInfo) => {
      testInfo.skip(
        !productWithReviews,
        'Set REVIEW_PRODUCT_CODE_WITH_REVIEWS in .env to run C46 tests',
      );
    });

    test(`should display the C46 review section on a tumblermug/goods/brewing product ${testTags.smoke}`, async ({
      productDetailPage,
    }) => {
      await productDetailPage.goto(productWithReviews!);

      await productDetailPage.expectC46Visible();
    });

    test(`should show has-review state: rating, review count link, post button, items, show-all link ${testTags.smoke}`, async ({
      productDetailPage,
    }) => {
      await productDetailPage.goto(productWithReviews!);

      await test.step('C46 has-review section is visible', async () => {
        await expect(productDetailPage.c46HasReview).toBeVisible();
      });

      await test.step('Review count link points to the review list', async () => {
        await expect(productDetailPage.c46ReviewCountLink).toBeVisible();
        await expect(productDetailPage.c46ReviewCountLink).toHaveAttribute(
          'href',
          `/${productWithReviews}/review`,
        );
      });

      await test.step('"レビューを投稿する" button is visible', async () => {
        await expect(productDetailPage.c46PostButton).toBeVisible();
        await expect(productDetailPage.c46PostButton).toHaveAttribute(
          'href',
          `/${productWithReviews}/review/create`,
        );
      });

      await test.step('At least one ReviewItem renders', async () => {
        await expect(productDetailPage.c46ReviewItems().first()).toBeVisible();
      });

      await test.step('"すべてのレビューを見る" link points to the review list', async () => {
        await expect(productDetailPage.c46ShowAllLink).toBeVisible();
        await expect(productDetailPage.c46ShowAllLink).toHaveAttribute(
          'href',
          `/${productWithReviews}/review`,
        );
      });
    });
  });

  test.describe('C46 no-review state', () => {
    test.beforeEach(async ({}, testInfo) => {
      testInfo.skip(
        !productNoReviews,
        'Set REVIEW_PRODUCT_CODE_NO_REVIEWS in .env to run C46 no-review state tests',
      );
    });

    test('should show no-review state with correct text and post link', async ({
      productDetailPage,
    }) => {
      await productDetailPage.goto(productNoReviews!);

      await test.step('No-review section is visible (not the has-review section)', async () => {
        await expect(productDetailPage.c46NoReview).toBeVisible();
      });

      await test.step('No-review text is correct', async () => {
        await expect(productDetailPage.c46NoReviewText).toContainText(
          reviewData.noReviewText,
        );
      });

      await test.step('"投稿する" link points to the review create page', async () => {
        await expect(productDetailPage.c46FirstPostLink).toHaveAttribute(
          'href',
          `/${productNoReviews}/review/create`,
        );
      });
    });
  });
});

test.describe(`C46 — Like button unauthenticated redirect ${testTags.regression}`, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({}, testInfo) => {
    testInfo.skip(
      !productWithReviews,
      'Set REVIEW_PRODUCT_CODE_WITH_REVIEWS in .env to run C46 Like redirect tests',
    );
  });

  test('should redirect to login page when unauthenticated user clicks Like on C46', async ({
    productDetailPage,
    page,
  }) => {
    await productDetailPage.goto(productWithReviews!);

    await test.step('C46 has-review section is visible', async () => {
      await expect(productDetailPage.c46HasReview).toBeVisible();
    });

    await test.step('Click Like on first review item', async () => {
      const firstItem = productDetailPage.c46ReviewItemAt(0);
      await Promise.all([
        page.waitForURL((url) => !url.pathname.includes(`/${productWithReviews}/review`)),
        firstItem.clickLike(),
      ]);
    });

    await test.step('URL no longer shows the product detail page', async () => {
      await expect(page).not.toHaveURL(new RegExp(`^/${productWithReviews}$`));
    });
  });
});
