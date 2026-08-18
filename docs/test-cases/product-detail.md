# Test Cases — product-detail

## c46.spec.ts

> C46 = review widget embedded on Product Detail pages (tumblermug / goods / brewing large categories).  
> All tests require `REVIEW_PRODUCT_CODE_WITH_REVIEWS` (and/or `REVIEW_PRODUCT_CODE_NO_REVIEWS`) set in `.env`; they skip gracefully when missing.

### C46 renders on applicable category product

| # | Kịch bản | Kỳ vọng chính |
|---|---|---|
| 1 | Navigate to a product in the tumblermug/goods/brewing large category. | The C46 review section (`.review-section` or `.review-section--no-review`) is visible on the page. |
| 2 | Navigate to a product with ≥1 approved review. | Has-review section visible; review count link href = `/{code}/review`; "レビューを投稿する" button href = `/{code}/review/create`; at least one ReviewItem rendered; "すべてのレビューを見る" link href = `/{code}/review`. |

### C46 no-review state

| # | Kịch bản | Kỳ vọng chính |
|---|---|---|
| 3 | Navigate to a product with 0 approved reviews in the applicable category. | `.review-section--no-review` is visible; text contains "最初のレビューを書いてみませんか？"; "投稿する" link href = `/{code}/review/create`. |

### C46 — Like button unauthenticated redirect

| # | Kịch bản | Kỳ vọng chính |
|---|---|---|
| 4 | Open the product detail page without auth; click Like on the first C46 review item. | URL navigates away from the product detail page (redirected to login/barista page). |

---

## c46.auth.spec.ts

> Requires auth storageState (via `auth.setup.ts`). All tests skip without `REVIEW_PRODUCT_CODE_WITH_REVIEWS`.

### C46 — Like button (authenticated)

| # | Kịch bản | Kỳ vọng chính |
|---|---|---|
| 5 | Logged-in user opens a product with reviews; clicks Like on the first review item, then clicks Like again. | Count increments by 1 after first click (optimistic update); count decrements back to original after second click; `prevent-click` class is removed after each API round-trip. |

---

**Notes**

- Tests 1–5 all skip if `REVIEW_PRODUCT_CODE_WITH_REVIEWS` is not set; test 3 additionally requires `REVIEW_PRODUCT_CODE_NO_REVIEWS`.
- Like-count assertions rely on the live review count from the server — counts fluctuate as other users like/unlike the same product. Test 5 uses a relative ±1 check to avoid hardcoding a specific value.
- C46 only renders when the product's large category is in `APPLIED_REVIEW_CATEGORIES` (`['beans', 'tealeaf', 'tumblermug', 'goods', 'brewing']`). Products outside this set will not show C46 regardless of auth state.
- Actual POST (create review from confirm page) is intentionally NOT automated to avoid accumulating test data on staging.
