import { test, expect } from '@fixtures/test-base';
import { env } from '@config/env';
import { testTags } from '@utils/test-tags';

const productWithReviews = env.review.productCodeWithReviews;

test.describe(`Review List — Like (authenticated) ${testTags.regression}`, () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.skip(
      !productWithReviews,
      'Set REVIEW_PRODUCT_CODE_WITH_REVIEWS in .env to run Review List Like auth tests',
    );
  });

  test.skip('should toggle like count when authenticated user clicks Like then Unlike', async ({
    reviewListPage,
  }) => {
    await reviewListPage.goto(productWithReviews!);

    const firstItem = reviewListPage.reviewItemAt(0);
    const initialCount = await firstItem.likeCount();

    await firstItem.clickLike();
    await expect(firstItem.likeButton).not.toHaveClass(/prevent-click/);
    await firstItem.expectLikeCount(initialCount + 1);

    await firstItem.clickLike();
    await expect(firstItem.likeButton).not.toHaveClass(/prevent-click/);
    await firstItem.expectLikeCount(initialCount);
  });
});
