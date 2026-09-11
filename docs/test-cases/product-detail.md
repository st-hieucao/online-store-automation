# Test cases — Product Detail (`/{code}`)

Tóm tắt test case tự động (Playwright) cho tính năng Product Detail, để verify nhanh không cần đọc
code. Cập nhật bởi skill `/summarize-test` — mỗi khi thêm/sửa test trong feature này, tìm file này
để cập nhật thay vì tạo file mới.

**Phạm vi hiện tại chỉ gồm C46** — widget review nhúng trên trang Product Detail (hiện với category
lớn `tumblermug`/`goods`/`brewing`, theo `APPLIED_REVIEW_CATEGORIES`). Toàn bộ core flow mua hàng của
trang này (add to cart, variant, gift wrap, breadcrumb, related products...) **chưa có test** — xem
`docs/test-plan.md` §4.2.

## c46.spec.ts

Spec: [tests/e2e/product-detail/c46.spec.ts](../../tests/e2e/product-detail/c46.spec.ts)
Page/Component Object: [tests/pages/product-detail.page.ts](../../tests/pages/product-detail.page.ts), [tests/pages/components/review-item.component.ts](../../tests/pages/components/review-item.component.ts)

### C46 renders on applicable category product (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 1 🔥 | should display the C46 review section on a tumblermug/goods/brewing product | Mở trang product thuộc category lớn tumblermug/goods/brewing | Section C46 (`.review-section` hoặc `.review-section--no-review`) visible |
| 2 🔥 | should show has-review state: rating, review count link, post button, items, show-all link | Mở trang product có ≥1 review đã duyệt | Has-review section visible; link số lượng review href = `/{code}/review`; nút "レビューを投稿する" href = `/{code}/review/create`; ít nhất 1 ReviewItem render; link "すべてのレビューを見る" href = `/{code}/review` |

### C46 no-review state (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 3 | should show no-review state with correct text and post link | Mở trang product có 0 review đã duyệt (cùng category áp dụng) | `.review-section--no-review` visible; text chứa "最初のレビューを書いてみませんか？"; link "投稿する" href = `/{code}/review/create` |

### C46 — Like button unauthenticated redirect (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 4 | should redirect to login page when unauthenticated user clicks Like on C46 | Mở trang product khi chưa login, click Like trên review item đầu tiên | URL điều hướng ra khỏi trang product detail (redirect tới trang login/barista) |

> Test #1–4 cần `REVIEW_PRODUCT_CODE_WITH_REVIEWS` (và/hoặc `REVIEW_PRODUCT_CODE_NO_REVIEWS` cho
> test #3) trong `.env` — skip gọn nếu thiếu. C46 chỉ render khi category lớn của sản phẩm nằm trong
> `APPLIED_REVIEW_CATEGORIES` (`['beans', 'tealeaf', 'tumblermug', 'goods', 'brewing']`).

## c46.auth.spec.ts

Spec: [tests/e2e/product-detail/c46.auth.spec.ts](../../tests/e2e/product-detail/c46.auth.spec.ts)
Page/Component Object: [tests/pages/product-detail.page.ts](../../tests/pages/product-detail.page.ts), [tests/pages/components/review-item.component.ts](../../tests/pages/components/review-item.component.ts)

### C46 — Like button (authenticated) (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| ~~5~~ | ~~should toggle like count when authenticated user clicks Like then Unlike~~ | ~~User đã login mở product có review; click Like rồi click lại~~ | ~~Tắt: `test.skip(...)` trực tiếp trong code, không có comment giải thích lý do — nên hỏi tác giả trước khi bật lại~~ |

> Yêu cầu auth storageState (qua `auth.setup.ts`), skip nếu thiếu `REVIEW_PRODUCT_CODE_WITH_REVIEWS`.
> Like-count vốn được thiết kế để assert tương đối (±1) vì user khác có thể like/unlike cùng lúc.

## Chưa cover / ngoài phạm vi

- Toàn bộ core flow mua hàng (P0, xem `docs/test-plan.md` §4.2): thông tin cơ bản (tên/giá/carousel
  ảnh), add to cart (single-SKU và multi-variant), trường hợp lỗi add-to-cart, gift wrap/Noshi,
  breadcrumb, trạng thái hết hàng/chưa mở bán/lottery, biến thể partner/preview, related products
  carousel, FloatingCart responsive trên mobile.
- Like/Unlike thật khi đã login (test #5) — đang tắt (`test.skip`), lý do chưa rõ trong code.
- "Rating & review summary" đầy đủ (average score hiển thị đúng, đúng 3 review mới nhất) — C46 mới
  assert có review item + các link, chưa assert average score hay đúng số lượng "3 latest".
