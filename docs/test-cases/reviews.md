# Test cases — Reviews

Tóm tắt test case tự động (Playwright) cho tính năng Review List và Review Create/Edit, để verify
nhanh không cần đọc code. Cập nhật bởi skill `/summarize-test` — mỗi khi thêm/sửa test trong feature
này, tìm file này để cập nhật thay vì tạo file mới. Không có route đơn lẻ (gồm `/{jan_code}/review`
và `/{jan_code}/review/create`, `/{jan_code}/review/{code}/edit`) nên tiêu đề không kèm route.

## review-list.spec.ts

Spec: [tests/e2e/reviews/review-list.spec.ts](../../tests/e2e/reviews/review-list.spec.ts)
Page/Component Object: [tests/pages/review-list.page.ts](../../tests/pages/review-list.page.ts), [tests/pages/components/review-item.component.ts](../../tests/pages/components/review-item.component.ts), [tests/pages/components/sort-select.component.ts](../../tests/pages/components/sort-select.component.ts)

### Has reviews (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 1 🔥 | should render page title, product info, rating and at least one review item | Mở trang list review của sản phẩm có review | Tiêu đề trang = "レビュー一覧"; tên & ảnh sản phẩm visible; rating stars visible; review item đầu tiên có ngày/tiêu đề/nội dung/reviewer không rỗng |
| 2 | "もっと見る" button expands truncated review content | Mở trang có review dài bị cắt ngắn, click "もっと見る" trên item đầu tiên | Chiều cao khung review item tăng lên sau khi click |

### Sort (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 3 🔥 | should update sort URL param when changing sort order | Đổi sort dropdown sang "参考になった順", rồi sang "評価が高い順" | `sort` param cập nhật thành `helpful` rồi `rating_high` sau mỗi lần chọn |

### Pagination (3 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 4 | should disable prev button on page 1 | Mở trang có nhiều trang review, xem trạng thái trang 1 | Pagination visible; nút prev disabled; chỉ số trang hiện tại = 1 |
| 5 | should navigate to the next page and disable next button on last page | Vào thẳng trang cuối cùng | Chỉ số trang khớp trang cuối; nút next disabled; có ít nhất 1 review item visible |
| 6 | should move to previous page when clicking prev button | Vào trang 2, click nút prev | Chỉ số trang hiện tại trở thành 1 |

### Post button — unauthenticated redirect (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 7 🔥 | should redirect to login when unauthenticated user clicks "レビューを投稿する" | Mở review list khi chưa login, click "レビューを投稿する" | URL rời khỏi path `/{code}/review` (redirect sang login/barista) |
| 8 | should redirect to login when unauthenticated user clicks Like | Mở review list khi chưa login, click Like trên review item đầu tiên | URL rời khỏi path `/{code}/review` |

### No reviews (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 9 | should show empty state text and hide sort/pagination | Mở review list của sản phẩm chưa có review nào được duyệt | Text kiểu "最初のレビューを書いてみませんか？" visible; sort select không render; pagination không render; link "投稿する" visible |

> Nhóm "has reviews" cần `REVIEW_PRODUCT_CODE_WITH_REVIEWS` trong `.env`; nhóm "no reviews" cần thêm
> `REVIEW_PRODUCT_CODE_NO_REVIEWS`. Cả 2 nhóm skip gọn nếu thiếu biến tương ứng. Test #4–6 skip nếu
> sản phẩm chỉ có 1 trang review. Test #2 skip nếu review đầu tiên không đủ dài để bị truncate.

🔥 = tagged `@smoke` (chạy trong `pnpm test:smoke`; các test khác trong file vẫn tính `@regression`).

## review-list.auth.spec.ts

Spec: [tests/e2e/reviews/review-list.auth.spec.ts](../../tests/e2e/reviews/review-list.auth.spec.ts)
Page/Component Object: [tests/pages/review-list.page.ts](../../tests/pages/review-list.page.ts), [tests/pages/components/review-item.component.ts](../../tests/pages/components/review-item.component.ts)

### Like (authenticated) (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| ~~1~~ | ~~should toggle like count when authenticated user clicks Like then Unlike~~ | ~~User đã login mở review list, click Like trên item đầu tiên rồi click lại~~ | ~~Tắt: `test.skip(...)` trực tiếp trong code, không có comment giải thích lý do — nên hỏi tác giả trước khi bật lại~~ |

> Yêu cầu auth storageState, skip nếu thiếu `REVIEW_PRODUCT_CODE_WITH_REVIEWS`. Like-count assertions
> (test này và tương đương ở C46 — xem `product-detail.md`) dùng kiểm tra tương đối ±1 thay vì hardcode
> con số, vì user khác có thể like/unlike cùng sản phẩm song song.

## review-create.auth.spec.ts

Spec: [tests/e2e/reviews/review-create.auth.spec.ts](../../tests/e2e/reviews/review-create.auth.spec.ts)
Page/Component Object: [tests/pages/review-form.page.ts](../../tests/pages/review-form.page.ts)

### Create Review flow (8 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 1 🔥 | should show review form with correct title on create page | Mở `/{code}/review/create` khi đã login | Tiêu đề trang = "レビューを投稿する"; input sao rating, textarea tiêu đề, textarea nội dung, phần nickname đều visible |
| 2 | submit button is disabled before filling the form | Vào trang create, chưa điền gì | Nút submit disabled |
| 3 | submit button remains disabled when no stars are selected | Điền tiêu đề + nội dung nhưng chưa chọn sao | Nút submit vẫn disabled |
| 4 | submit button is disabled when title exceeds 50 characters | Chọn 5 sao, điền nội dung hợp lệ, nhưng tiêu đề dài hơn 50 ký tự | Nút submit disabled; `titleCharCount()` trả về giá trị > 50 |
| 5 | submit button is disabled when content is shorter than 25 characters | Chọn 5 sao, điền tiêu đề hợp lệ, nhưng nội dung ngắn hơn 25 ký tự | Nút submit disabled |
| 6 | submit button is disabled when content exceeds 400 characters | Chọn 5 sao, điền tiêu đề hợp lệ, nhưng nội dung dài hơn 400 ký tự | Nút submit disabled |
| 7 🔥 | happy path: valid form → confirm screen shows entered data correctly | Điền form đầy đủ hợp lệ (5 sao, tiêu đề + nội dung hợp lệ), click "内容確認へ" | Nút submit enabled trước khi click; URL có thêm `#confirm`; bước confirm hiện đúng heading + đúng tiêu đề/nội dung đã nhập |
| 8 | "入力画面へ戻る" from confirm returns to the form URL | Điền form hợp lệ, qua bước confirm, click "入力画面へ戻る" | URL không còn `#confirm` (quay lại bước form) |

### Edit Review flow (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 9 | should pre-fill the form with existing review data on the edit page | Mở URL edit đã biết (`REVIEW_EDIT_PATH`) khi đã login | Tiêu đề trang = "レビュー編集"; textarea tiêu đề và nội dung đã điền sẵn dữ liệu cũ |
| 10 🔥 | should show "レビュー内容確認" on confirm step for edit | Vào trang edit (đã điền sẵn), click "内容確認へ" ngay | Nút submit đã enabled sẵn (dữ liệu cũ hợp lệ); bước confirm hiện tiêu đề "レビュー内容確認" |

### Create Review — no nickname (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 11 | should disable submit and show nickname register link when account has no nickname | Mở trang create bằng account chưa có nickname | Nút submit disabled; link đăng ký nickname visible |

> Tất cả test yêu cầu auth storageState; test tạo/sửa skip nếu thiếu `REVIEW_PRODUCT_CODE_WITH_REVIEWS`
> hoặc `REVIEW_EDIT_PATH` tương ứng. Test #11 skip nếu account test đang có sẵn nickname. Chuỗi
> confirm → submit thật → complete **cố tình không tự động hoá** để tránh tích luỹ review rác trên
> staging — trang Complete (`/review/create/complete`, tiêu đề "レビュー投稿完了") cần verify thủ công.

🔥 = tagged `@smoke` (chạy trong `pnpm test:smoke`; các test khác trong file vẫn tính `@regression`).

## Chưa cover / ngoài phạm vi

- Report (báo cáo review) — chưa có test nào, cả khi guest lẫn khi đã login (mở modal, submit).
- Avatar hiển thị trên review item — chỉ assert chung "reviewer" không rỗng, chưa assert riêng ảnh avatar.
- "Post review" khi ĐÃ login → điều hướng đúng tới `/create` — hiện chỉ test hành vi guest (redirect
  khi chưa login), chưa test click thật khi đã login.
- Responsive: layout showcase sản phẩm đổi vị trí (trái/trên) theo breakpoint — chưa test.
- Review Create/Edit: validation tiêu đề/nội dung từ chối emoji, ký tự đặc biệt, xuống dòng — mới
  test giới hạn độ dài (min/max), chưa test riêng các ký tự này.
- "Back to edit" giữ nguyên dữ liệu đã nhập — mới assert URL quay lại bước form, chưa assert dữ liệu
  form được giữ nguyên.
- Submit thật (confirm → complete, cả tạo mới và sửa) — chủ đích không tự động hoá, xem ghi chú ở
  `review-create.auth.spec.ts` phía trên.
- Truy cập trực tiếp `/review/create` hoặc `/review/{code}/edit` khi chưa login → redirect — chưa có
  test riêng cho 2 route này (chỉ có test tương tự cho Review List và My Reviews).
- Like/Unlike thật khi đã login trên Review List (test ~~1~~ ở `review-list.auth.spec.ts`) — đang tắt.
