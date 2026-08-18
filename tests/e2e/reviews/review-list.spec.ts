import { test, expect } from '@fixtures/test-base';
import { env } from '@config/env';
import { reviewData } from '@test-data/review.data';
import { testTags } from '@utils/test-tags';

const productWithReviews = env.review.productCodeWithReviews;
const productNoReviews = env.review.productCodeNoReviews;

test.describe(`Review List — has reviews ${testTags.regression}`, () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.skip(
      !productWithReviews,
      'Set REVIEW_PRODUCT_CODE_WITH_REVIEWS in .env to run Review List tests',
    );
  });

  test(`should render page title, product info, rating and at least one review item ${testTags.smoke}`, async ({
    reviewListPage,
  }) => {
    await reviewListPage.goto(productWithReviews!);

    await test.step('Page title is correct', async () => {
      await expect(reviewListPage.pageTitle).toHaveText(reviewData.listPageTitle);
    });

    await test.step('Product name and image are visible', async () => {
      await expect(reviewListPage.productName).not.toBeEmpty();
      await expect(reviewListPage.productImageLink).toBeVisible();
    });

    await test.step('Rating stars are visible', async () => {
      await expect(reviewListPage.ratingStar).toBeVisible();
    });

    await test.step('At least one review item renders with date, title, content, reviewer', async () => {
      await reviewListPage.reviewItemAt(0).expectContent();
    });
  });

  test('"もっと見る" button expands truncated review content', async ({ reviewListPage }) => {
    await reviewListPage.goto(productWithReviews!);

    const firstItem = reviewListPage.reviewItemAt(0);
    const seeMoreBtn = firstItem.seeMoreButton;

    test.skip(
      !(await seeMoreBtn.isVisible()),
      'First review item does not have a "もっと見る" button — all content fits without truncation',
    );

    const contentBefore = await firstItem.content.boundingBox();
    await seeMoreBtn.click();
    const contentAfter = await firstItem.content.boundingBox();

    expect(contentAfter!.height).toBeGreaterThan(contentBefore!.height);
  });

  test.describe('sort', () => {
    test(`should update sort URL param when changing sort order ${testTags.smoke}`, async ({
      reviewListPage,
      page,
    }) => {
      await reviewListPage.goto(productWithReviews!);

      await test.step('Change sort to most-helpful', async () => {
        await Promise.all([
          page.waitForURL(new RegExp(`sort=${reviewData.sort.helpful.value}`)),
          reviewListPage.sortSelect.selectByValue(reviewData.sort.helpful.value),
        ]);
        await reviewListPage.expectSortParam(reviewData.sort.helpful.value);
      });

      await test.step('Change sort to highest rating', async () => {
        await Promise.all([
          page.waitForURL(new RegExp(`sort=${reviewData.sort.ratingHigh.value}`)),
          reviewListPage.sortSelect.selectByValue(reviewData.sort.ratingHigh.value),
        ]);
        await reviewListPage.expectSortParam(reviewData.sort.ratingHigh.value);
      });
    });
  });

  test.describe('pagination', () => {
    test('should disable prev button on page 1', async ({ reviewListPage }) => {
      await reviewListPage.goto(productWithReviews!);

      const lastPage = await reviewListPage.lastPageValue();
      test.skip(lastPage === '1', 'Product has only one page of reviews — pagination not rendered');

      await expect(reviewListPage.pagination.root).toBeVisible();
      await reviewListPage.expectPaginationPrevDisabled();
      await reviewListPage.expectCurrentPage('1');
    });

    test('should navigate to the next page and disable next button on last page', async ({
      reviewListPage,
    }) => {
      await reviewListPage.goto(productWithReviews!);

      const lastPage = await reviewListPage.lastPageValue();
      test.skip(lastPage === '1', 'Product has only one page of reviews');

      await test.step('Navigate to last page', async () => {
        await reviewListPage.goto(productWithReviews!, { page: lastPage });
        await reviewListPage.expectCurrentPage(lastPage);
      });

      await test.step('Next button is disabled on last page', async () => {
        await reviewListPage.expectPaginationNextDisabled();
      });

      await test.step('At least one review item is visible on last page', async () => {
        await expect(reviewListPage.reviewItems().first()).toBeVisible();
      });
    });

    test('should move to previous page when clicking prev button', async ({
      reviewListPage,
    }) => {
      await reviewListPage.goto(productWithReviews!);

      const lastPage = await reviewListPage.lastPageValue();
      test.skip(
        Number(lastPage) < 2,
        'Product has fewer than 2 pages of reviews — prev navigation not testable',
      );

      await test.step('Navigate to page 2', async () => {
        await reviewListPage.goto(productWithReviews!, { page: '2' });
        await reviewListPage.expectCurrentPage('2');
      });

      await test.step('Click prev and verify page decrements', async () => {
        await reviewListPage.goToPrevPage();
        await reviewListPage.expectCurrentPage('1');
      });
    });
  });

  test.describe('post button — unauthenticated redirect', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test(`should redirect to login when unauthenticated user clicks "レビューを投稿する" ${testTags.smoke}`, async ({
      reviewListPage,
      page,
    }) => {
      await reviewListPage.goto(productWithReviews!);

      await test.step('Click post-review button', async () => {
        await Promise.all([
          page.waitForURL(
            (url) => !url.pathname.startsWith(`/${productWithReviews}/review`),
          ),
          reviewListPage.postButton.click(),
        ]);
      });

      await test.step('URL is no longer the review list', async () => {
        await expect(page).not.toHaveURL(new RegExp(`/${productWithReviews}/review`));
      });
    });

    test('should redirect to login when unauthenticated user clicks Like', async ({
      reviewListPage,
      page,
    }) => {
      await reviewListPage.goto(productWithReviews!);

      const firstItem = reviewListPage.reviewItemAt(0);

      await test.step('Click Like without auth', async () => {
        await Promise.all([
          page.waitForURL(
            (url) => !url.pathname.startsWith(`/${productWithReviews}/review`),
          ),
          firstItem.clickLike(),
        ]);
      });

      await test.step('URL is no longer the review list', async () => {
        await expect(page).not.toHaveURL(new RegExp(`/${productWithReviews}/review`));
      });
    });
  });
});

test.describe(`Review List — no reviews ${testTags.regression}`, () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.skip(
      !productNoReviews,
      'Set REVIEW_PRODUCT_CODE_NO_REVIEWS in .env to run no-review state tests',
    );
  });

  test('should show empty state text and hide sort/pagination', async ({ reviewListPage }) => {
    await reviewListPage.goto(productNoReviews!);

    await test.step('No-review text is visible', async () => {
      await expect(reviewListPage.noReviewText).toContainText(reviewData.noReviewText);
    });

    await test.step('Sort select is not visible', async () => {
      await expect(reviewListPage.sortSelect.select).toHaveCount(0);
    });

    await test.step('Pagination is not visible', async () => {
      await expect(reviewListPage.pagination.root).toHaveCount(0);
    });

    await test.step('"投稿する" link is visible', async () => {
      await expect(reviewListPage.postButton).toBeVisible();
    });
  });
});
