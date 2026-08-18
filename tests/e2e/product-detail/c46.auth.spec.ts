import { test, expect } from '@fixtures/test-base';
import { env } from '@config/env';
import { testTags } from '@utils/test-tags';

const productWithReviews = env.review.productCodeWithReviews;

test.describe(`C46 — Like button (authenticated) ${testTags.regression}`, () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.skip(
      !productWithReviews,
      'Set REVIEW_PRODUCT_CODE_WITH_REVIEWS in .env to run C46 Like auth tests',
    );
  });

  test.skip('should toggle like count when authenticated user clicks Like then Unlike', async ({
    productDetailPage,
  }) => {
    await productDetailPage.goto(productWithReviews!);

    await test.step('C46 has-review section is visible', async () => {
      await expect(productDetailPage.c46HasReview).toBeVisible();
    });

    const firstItem = productDetailPage.c46ReviewItemAt(0);
    const initialCount = await firstItem.likeCount();

    await test.step('Click Like — count increments (optimistic update)', async () => {
      await firstItem.clickLike();
      await firstItem.expectLikeCount(initialCount + 1);
    });

    await test.step('Wait for API processing to finish', async () => {
      await expect(firstItem.likeButton).not.toHaveClass(/prevent-click/);
    });

    await test.step('Click Like again — count decrements back to original', async () => {
      await firstItem.clickLike();
      await firstItem.expectLikeCount(initialCount);
    });

    await test.step('Wait for API processing to finish', async () => {
      await expect(firstItem.likeButton).not.toHaveClass(/prevent-click/);
    });
  });
});
