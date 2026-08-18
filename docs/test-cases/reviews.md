# Test Cases — reviews

## review-list.spec.ts

> All tests in the "has reviews" group require `REVIEW_PRODUCT_CODE_WITH_REVIEWS` in `.env`; the "no reviews" group additionally requires `REVIEW_PRODUCT_CODE_NO_REVIEWS`. Both groups skip gracefully when their respective env var is absent.

### Review List — has reviews

| # | Kịch bản | Kỳ vọng chính |
|---|---|---|
| 1 | Navigate to the review list of a product with reviews. | Page title equals "レビュー一覧"; product name and image are visible; rating stars visible; first review item has non-empty date, title, content, and reviewer. |
| 2 | Navigate to a product with a long review whose content is truncated; click "もっと見る" on the first item (skips if no truncation present). | Review item's bounding box height increases after clicking the button. |
| 3 | Navigate to the review list; change the sort dropdown to "参考になった順", then to "評価が高い順". | URL `sort` query param updates to `helpful` then `rating_high` after each selection. |
| 4 | Navigate to a product with multiple pages; observe page 1 state. | Pagination is visible; previous button is disabled; current page indicator is `1`. |
| 5 | Navigate directly to the last page of reviews. | Current page indicator matches the last page number; next/last button is disabled; at least one review item is visible. |
| 6 | Navigate to page 2 of reviews; click the previous-page button. | Current page indicator becomes `1`. |

### Review List — post button / Like unauthenticated redirect

| # | Kịch bản | Kỳ vọng chính |
|---|---|---|
| 7 | Open the review list without auth; click "レビューを投稿する". | URL changes away from the `/{code}/review` path (redirected to login/barista page). |
| 8 | Open the review list without auth; click Like on the first review item. | URL changes away from the `/{code}/review` path. |

### Review List — no reviews

| # | Kịch bản | Kỳ vọng chính |
|---|---|---|
| 9 | Navigate to the review list of a product with no approved reviews. | "最初のレビューを書いてみませんか？"-like text is visible; sort select is not rendered; pagination is not rendered; "投稿する" (post) link is visible. |

---

## review-list.auth.spec.ts

> Requires auth storageState. Skips without `REVIEW_PRODUCT_CODE_WITH_REVIEWS`.

### Review List — Like (authenticated)

| # | Kịch bản | Kỳ vọng chính |
|---|---|---|
| 10 | Logged-in user opens the review list; clicks Like on the first item, then clicks Like again. | Like count increments by 1 after the first click (optimistic update); `prevent-click` class disappears after API round-trip; count decrements back to the initial value after the second click; `prevent-click` clears again. |

---

## review-create.auth.spec.ts

> All tests require auth storageState. Create/edit tests skip without `REVIEW_PRODUCT_CODE_WITH_REVIEWS` or `REVIEW_EDIT_PATH` respectively.

### Create Review flow

| # | Kịch bản | Kỳ vọng chính |
|---|---|---|
| 11 | Navigate to `/{code}/review/create` as a logged-in user. | Page title is "レビューを投稿する"; star rating input, title textarea, content textarea, and nickname section are all visible. |
| 12 | Arrive at the create page without filling anything. | Submit button is disabled. |
| 13 | Fill title and content but leave stars unselected. | Submit button remains disabled. |
| 14 | Select 5 stars, fill valid content, but enter a title longer than 50 characters. | Submit button is disabled; `titleCharCount()` reports a value greater than 50. |
| 15 | Select 5 stars, fill a valid title, but enter content shorter than 25 characters. | Submit button is disabled. |
| 16 | Select 5 stars, fill a valid title, but enter content longer than 400 characters. | Submit button is disabled. |
| 17 | Fill the form fully with valid data (5 stars, valid title and content); click "内容確認へ". | Submit button is enabled before click; URL gains `#confirm`; confirm step shows the correct title heading and echoes the entered title and content. |
| 18 | Fill the form with valid data, advance to the confirm step; click "入力画面へ戻る". | URL no longer contains `#confirm` (returns to the form step). |

### Edit Review flow

| # | Kịch bản | Kỳ vọng chính |
|---|---|---|
| 19 | Navigate to a known edit URL (`REVIEW_EDIT_PATH`) as a logged-in user. | Page title is "レビュー編集"; title textarea is pre-filled with existing data; content textarea is pre-filled with existing data. |
| 20 | Navigate to the edit page (pre-filled); click "内容確認へ" immediately. | Submit button is already enabled (existing data satisfies validation); confirm step renders with title "レビュー内容確認". |

### Create Review — no nickname

| # | Kịch bản | Kỳ vọng chính |
|---|---|---|
| 21 | Navigate to the create page as a logged-in user with no nickname registered (skips if the test account has a nickname). | Submit button is disabled; nickname registration link is visible. |

---

**Notes**

- Tests 4–6 (pagination) and test 10 (auth Like) skip when the product has only one page of reviews.
- Test 2 ("もっと見る") skips if the first review item on the live product fits without truncation — this is a content-dependent state.
- Test 18 (edit Like) and the full confirm → submit → complete sequence are intentionally NOT automated to avoid accumulating test reviews on staging. The complete page (`/review/create/complete`, title "レビュー投稿完了") should be verified manually.
- Like-count assertions (tests 10, and the C46 equivalent in `product-detail.md`) use relative ±1 checks rather than hardcoded counts, since other users may like/unlike the same review concurrently.
