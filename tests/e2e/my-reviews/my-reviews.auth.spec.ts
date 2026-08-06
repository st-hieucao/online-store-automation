import { test, expect } from '@fixtures/test-base';
import { myReviewsData } from '@test-data/my-reviews.data';
import { testTags } from '@utils/test-tags';

test.describe(`My Reviews ${testTags.regression}`, () => {
  test.describe('page structure', () => {
    test(`should show heading and review count ${testTags.smoke}`, async ({ myReviewsPage }) => {
      await myReviewsPage.goto();

      await expect(myReviewsPage.heading).toHaveText(myReviewsData.heading);
      await expect(myReviewsPage.reviewCount).toBeVisible();
    });

    test(`should render all required elements on the page ${testTags.smoke}`, async ({ myReviewsPage }) => {
      await myReviewsPage.goto();

      await expect(myReviewsPage.heading).toBeVisible();
      await expect(myReviewsPage.reviewCount).toBeVisible();
      await expect(myReviewsPage.tabArea).toBeVisible();
      // review list is visible when the account has reviews (this test account does)
      await expect(myReviewsPage.reviewItems().first()).toBeVisible();
    });
  });

  test.describe('header and footer', () => {
    test(`should render the header with correct logo link ${testTags.smoke}`, async ({
      myReviewsPage,
    }) => {
      await myReviewsPage.goto();

      await test.step('Header element is visible', async () => {
        await expect(myReviewsPage.header).toBeVisible();
      });

      await test.step('First header link has the expected href', async () => {
        const link = myReviewsPage.header.locator('a').first();
        await expect(link).toHaveAttribute('href', myReviewsData.header.linkHrefPattern);
      });
    });

    test(`should render the footer with the FAQ link ${testTags.smoke}`, async ({
      myReviewsPage,
    }) => {
      await myReviewsPage.goto();

      await test.step('Footer element is visible', async () => {
        await expect(myReviewsPage.footer).toBeVisible();
      });

      await test.step('FAQ link in footer has the correct href', async () => {
        const faqLink = myReviewsPage.footer.getByText(myReviewsData.footer.faqText);
        await expect(faqLink).toBeVisible();
        await expect(faqLink).toHaveAttribute('href', myReviewsData.footer.faqHrefPattern);
      });
    });
  });

  test.describe('tabs', () => {
    test('should display newest tab by default', async ({ myReviewsPage }) => {
      await myReviewsPage.goto();

      await expect(
        myReviewsPage.tabArea.getByText(myReviewsData.sort.newest.label),
      ).toBeVisible();
    });

    test(`should update sort query param when switching to oldest tab ${testTags.smoke}`, async ({ myReviewsPage }) => {
      await myReviewsPage.goto();

      await test.step('Click oldest tab', async () => {
        await myReviewsPage.clickTab(myReviewsData.sort.oldest.label);
      });

      await test.step('URL reflects date-old sort param', async () => {
        await myReviewsPage.expectSortParam(myReviewsData.sort.oldest.value);
      });
    });

    test(`should update sort query param when switching back to newest tab ${testTags.smoke}`, async ({
      myReviewsPage,
    }) => {
      await myReviewsPage.goto({ sort: myReviewsData.sort.oldest.value });

      await test.step('Click newest tab', async () => {
        await myReviewsPage.clickTab(myReviewsData.sort.newest.label);
      });

      await test.step('URL reflects date-new sort param', async () => {
        await myReviewsPage.expectSortParam(myReviewsData.sort.newest.value);
      });
    });

    test('should keep page param in URL when switching to newest tab', async ({ myReviewsPage }) => {
      await myReviewsPage.goto({ page: '2', sort: myReviewsData.sort.oldest.value });

      await myReviewsPage.clickTab(myReviewsData.sort.newest.label);

      await myReviewsPage.expectSortParam(myReviewsData.sort.newest.value);
      await myReviewsPage.expectPageParam('2');
    });

    test('should keep page param in URL when switching to oldest tab', async ({ myReviewsPage }) => {
      await myReviewsPage.goto({ page: '2', sort: myReviewsData.sort.newest.value });

      await myReviewsPage.clickTab(myReviewsData.sort.oldest.label);

      await myReviewsPage.expectSortParam(myReviewsData.sort.oldest.value);
      await myReviewsPage.expectPageParam('2');
    });
  });

  test.describe('review item', () => {
    test(`should render date, product name, stars, title and content for the first item ${testTags.smoke}`, async ({
      myReviewsPage,
    }) => {
      await myReviewsPage.goto();
      await myReviewsPage.expectItemContent(0);
    });

    test('should display posting date in YYYY/MM/DD format', async ({ myReviewsPage }) => {
      await myReviewsPage.goto();
      await myReviewsPage.expectDateFormat(0, myReviewsData.dateFormat);
    });

    test('should navigate to the review edit page when clicking the edit button', async ({
      myReviewsPage,
      page,
    }) => {
      await myReviewsPage.goto();

      await test.step('Click edit on first item', async () => {
        await myReviewsPage.clickEdit(0);
      });

      await test.step('URL navigates to the review edit page', async () => {
        await expect(page).toHaveURL(/\/review\/[^/]+\/edit$/);
      });
    });

    test('should show NO IMAGE placeholder for off-sale product', async ({ myReviewsPage }) => {
      const noImageItem = await myReviewsPage.findNoImageItemAcrossPages(5);

      test.skip(noImageItem === null, 'No off-sale items found across first 5 pages');

      await myReviewsPage.expectItemImageNoSrc(noImageItem!);
    });

    test('should not navigate when clicking a NO IMAGE product link', async ({
      myReviewsPage,
      page,
    }) => {
      const noImageItem = await myReviewsPage.findNoImageItemAcrossPages(5);

      test.skip(noImageItem === null, 'No off-sale items found across first 5 pages — skipping prevent-click assertion');

      const currentUrl = page.url();
      await myReviewsPage.clickItemImage(noImageItem!, { force: true });
      await expect(page).toHaveURL(currentUrl);
    });

    test('should show product image with correct URL for on-sale product', async ({
      myReviewsPage,
    }) => {
      const result = await myReviewsPage.findOnSaleItemAcrossPages(5);

      test.skip(result === null, 'No on-sale items found across first 5 pages');

      await myReviewsPage.expectItemImageSrc(result!.index, myReviewsData.image.urlPattern);
    });

    test('should navigate to product page when clicking image of on-sale product', async ({
      myReviewsPage,
      page,
    }) => {
      const result = await myReviewsPage.findOnSaleItemAcrossPages(5);

      test.skip(result === null, 'No on-sale items found across first 5 pages');

      const currentUrl = page.url();
      const navPromise = page.waitForURL((url) => url.href !== currentUrl, { waitUntil: 'commit' });
      await myReviewsPage.clickItemImage(result!.item);
      await navPromise;
      await expect(page).not.toHaveURL(currentUrl);
    });

    test('should show NO IMAGE and not navigate when clicking image of non-public product', async ({
      myReviewsPage,
      page,
    }) => {
      const noImageItem = await myReviewsPage.findNoImageItemAcrossPages(5);

      test.skip(noImageItem === null, 'No non-public/off-sale items found across first 5 pages');

      await myReviewsPage.expectItemImageNoSrc(noImageItem!);
      const currentUrl = page.url();
      await myReviewsPage.clickItemImage(noImageItem!, { force: true });
      await expect(page).toHaveURL(currentUrl);
    });
  });

  test.describe('delete', () => {
    test(`should show confirm modal when clicking delete ${testTags.smoke}`, async ({ myReviewsPage }) => {
      await myReviewsPage.goto();

      await test.step('Click delete on first item', async () => {
        await myReviewsPage.clickDelete(0);
      });

      await test.step('Confirm modal appears with correct message', async () => {
        await myReviewsPage.expectDeleteModal();
      });
    });

    // TODO: re-enable when test data can be re-seeded after each run
    // test('should remove the item and show success modal after confirming delete', async ({
    //   myReviewsPage,
    // }) => {
    //   test.slow(); // mutates live data — allow extra time for the API round-trip
    //   await myReviewsPage.goto();
    //   const totalBefore = await myReviewsPage.totalReviewCount();
    //   test.skip(totalBefore === 0, 'Test account has no reviews left — re-seed required');
    //
    //   await test.step('Open delete modal', async () => {
    //     await myReviewsPage.clickDelete(0);
    //     await myReviewsPage.expectDeleteModal();
    //   });
    //
    //   await test.step('Confirm deletion', async () => {
    //     await myReviewsPage.confirmDelete();
    //   });
    //
    //   await test.step('Success flash modal is shown', async () => {
    //     await myReviewsPage.expectDeleteSuccessModal();
    //   });
    //
    //   await test.step('Dismiss flash and verify total review count decreased by one', async () => {
    //     await myReviewsPage.dismissDeleteSuccessModal();
    //     await myReviewsPage.expectTotalReviewCount(totalBefore - 1);
    //   });
    // });
  });

  test.describe('pagination', () => {
    test('should render pagination and disable prev on page 1', async ({ myReviewsPage }) => {
      await myReviewsPage.goto();

      await expect(myReviewsPage.pagination.root).toBeVisible();
      await myReviewsPage.pagination.expectPrevDisabled();
      await myReviewsPage.pagination.expectCurrentPage('1');
    });

    test('should move to the next page when clicking >', async ({ myReviewsPage }) => {
      let midPage: string;

      await test.step('Navigate to page 1 and compute mid page', async () => {
        await myReviewsPage.goto();
        const lastPage = await myReviewsPage.pagination.lastPageValue();
        midPage = String(Math.max(1, Math.floor(Number(lastPage) / 2)));
        await myReviewsPage.goto({ page: midPage });
        await myReviewsPage.pagination.expectCurrentPage(midPage);
      });

      await test.step('Click > and verify page incremented', async () => {
        await myReviewsPage.pagination.goNext();
        await myReviewsPage.pagination.expectCurrentPage(String(Number(midPage) + 1));
      });
    });

    test('should move to the previous page when clicking <', async ({ myReviewsPage }) => {
      let midPage: string;

      await test.step('Navigate to page 1 and compute mid page', async () => {
        await myReviewsPage.goto();
        const lastPage = await myReviewsPage.pagination.lastPageValue();
        midPage = String(Math.max(2, Math.floor(Number(lastPage) / 2)));
        await myReviewsPage.goto({ page: midPage });
        await myReviewsPage.pagination.expectCurrentPage(midPage);
      });

      await test.step('Click < and verify page decremented', async () => {
        await myReviewsPage.pagination.goPrevious();
        await myReviewsPage.pagination.expectCurrentPage(String(Number(midPage) - 1));
      });
    });

    test('should show the last page correctly and disable next', async ({ myReviewsPage }) => {
      await myReviewsPage.goto();
      const lastPage = await myReviewsPage.pagination.lastPageValue();

      await myReviewsPage.goto({ page: lastPage });
      await myReviewsPage.pagination.expectCurrentPage(lastPage);
      await myReviewsPage.pagination.expectNextDisabled();
      await expect(myReviewsPage.reviewItems().first()).toBeVisible();
    });

    test('should show reviews on the second-to-last page', async ({ myReviewsPage }) => {
      await myReviewsPage.goto();
      const lastPage = Number(await myReviewsPage.pagination.lastPageValue());
      test.skip(lastPage <= 1, 'Account has only 1 page of reviews — second-to-last page does not exist');
      const secondToLast = String(lastPage - 1);

      await myReviewsPage.goto({ page: secondToLast });
      await myReviewsPage.pagination.expectCurrentPage(secondToLast);
      await expect(myReviewsPage.reviewItems().first()).toBeVisible();
    });
  });
});

test.describe(`My Reviews — unauthenticated ${testTags.smoke}`, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should redirect away from /mystarbucks/review when not logged in', async ({ page }) => {
    await page.goto('/mystarbucks/review');
    await expect(page).not.toHaveURL(/\/mystarbucks\/review/);
  });
});
