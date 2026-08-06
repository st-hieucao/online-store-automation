# Test cases — My Reviews (`/mystarbucks/review`)

Tóm tắt test case tự động (Playwright) cho tính năng My Reviews, để verify nhanh không cần đọc code.
Cập nhật bởi skill `/summarize-test` — mỗi khi thêm/sửa test trong feature này, tìm file này để cập
nhật thay vì tạo file mới.

## my-reviews.auth.spec.ts

Spec: [tests/e2e/my-reviews/my-reviews.auth.spec.ts](../../tests/e2e/my-reviews/my-reviews.auth.spec.ts)
Page/Component Object: [tests/pages/my-reviews.page.ts](../../tests/pages/my-reviews.page.ts), [tests/pages/components/pagination.component.ts](../../tests/pages/components/pagination.component.ts)

### Page structure (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 1 🔥 | should show heading and review count | Truy cập `/mystarbucks/review` khi đã đăng nhập | Heading có đúng text "マイレビュー"; badge tổng số review visible |
| 2 🔥 | should render all required elements on the page | Truy cập trang | Heading, badge count, tab area, và ít nhất 1 review item đều visible |

### Header and footer (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 3 🔥 | should render the header with correct logo link | Truy cập trang | `header.globalNav` visible; link đầu tiên trong header có href chứa `starbucks.co.jp/?nid=mm` |
| 4 🔥 | should render the footer with the FAQ link | Truy cập trang | `footer.footerWrap` visible; link "よくあるご質問・お問い合わせ" visible và href chứa `starbucks.co.jp/faq/?nid=ft` |

> Header/footer được inject từ CDN HTML. Logo link trong header có `display:none` theo CSS nên chỉ
> check `href` attribute, không check visibility. CDN load balancer có thể trả về `www` hoặc `www2`
> subdomain — chỉ assert domain và `nid` param, không assert exact subdomain.

### Tabs (5 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 5 | should display newest tab by default | Truy cập trang mặc định | Tab "投稿日の新しい順" hiển thị trong tab area |
| 6 🔥 | should update sort query param when switching to oldest tab | Click tab "投稿日の古い順" | URL có `sort=date-old` |
| 7 🔥 | should update sort query param when switching back to newest tab | Vào với `?sort=date-old`, click tab "投稿日の新しい順" | URL có `sort=date-new` |
| 8 | should keep page param in URL when switching to newest tab | Vào với `?page=2&sort=date-old`, click tab "投稿日の新しい順" | URL có `sort=date-new` và giữ nguyên `page=2` |
| 9 | should keep page param in URL when switching to oldest tab | Vào với `?page=2&sort=date-new`, click tab "投稿日の古い順" | URL có `sort=date-old` và giữ nguyên `page=2` |

> Tab switch là client-side only — cả hai list (`data_new`, `data_old`) được server trả về ngay từ
> lúc load trang, không có network request khi đổi tab.

### Review item (8 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 10 🔥 | should render date, product name, stars, title and content for the first item | Truy cập trang có review | Item đầu tiên hiển thị đủ: ngày đăng, tên sản phẩm, stars, tiêu đề, nội dung |
| 11 | should display posting date in YYYY/MM/DD format | Kiểm tra format ngày của item đầu tiên | Ngày hiển thị đúng format `YYYY/MM/DD` |
| 12 | should navigate to the review edit page when clicking the edit button | Click "編集" trên item đầu tiên | URL chuyển đến `/{item_code}/review/{review_code}/edit` |
| 13 | should show NO IMAGE placeholder for off-sale product | Tìm item off-sale qua tối đa 5 trang, kiểm tra ảnh | Element có class `prevent-click` |
| 14 | should not navigate when clicking a NO IMAGE product link | Tìm item off-sale, force click ảnh | URL không thay đổi |
| 15 | should show product image with correct URL for on-sale product | Tìm item on-sale qua tối đa 5 trang, kiểm tra URL ảnh | `src` khớp pattern `/public/sku_images/{item_code}/{item_code}_1.jpg` |
| 16 | should navigate to product page when clicking image of on-sale product | Tìm item on-sale, click ảnh | URL thay đổi (navigate đến product page) |
| 17 | should show NO IMAGE and not navigate when clicking image of non-public product | Tìm item non-public/off-sale, kiểm tra ảnh rồi force click | Element có class `prevent-click`; click không navigate |

> Test #13–17 tìm item phù hợp qua tối đa 5 trang (`findNoImageItemAcrossPages` /
> `findOnSaleItemAcrossPages`) — nếu không tìm thấy thì `test.skip` **tại runtime** tuỳ dữ liệu tài
> khoản test (hiện trong reporter là skipped, không phải lỗi/không phải test bị tắt vĩnh viễn). Test
> #14, #17 dùng `{ force: true }` để bypass `pointer-events: none` của `.prevent-click`.

### Delete (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 18 🔥 | should show confirm modal when clicking delete | Click "削除" trên item đầu tiên | ConfirmModal hiện với message "このレビューを削除しますか？" |
| ~~19~~ | ~~should remove the item and show success modal after confirming delete~~ | ~~Click "削除" → modal → confirm → dismiss success~~ | ~~Tắt: mutates live data, cần re-seed sau mỗi lần chạy. Re-enable khi có cơ chế seed.~~ |

### Pagination (5 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 20 | should render pagination and disable prev on page 1 | Truy cập page 1 | Pagination visible; nút `<` disabled; page hiện tại là `1` |
| 21 | should move to the next page when clicking > | Navigate đến trang giữa rồi click `>` | Page tăng lên đúng 1 |
| 22 | should move to the previous page when clicking < | Navigate đến trang giữa rồi click `<` | Page giảm đúng 1 |
| 23 | should show the last page correctly and disable next | Navigate đến trang cuối | Page cuối hiển thị đúng; nút `>` disabled; có review items |
| 24 | should show reviews on the second-to-last page | Navigate đến trang kế trước trang cuối | Page hiển thị đúng; có review items |

> Pagination tests dùng `lastPageValue()` động theo số review thực của account — không hardcode số
> trang. Test #24 skip tại runtime nếu account chỉ có 1 trang (second-to-last không tồn tại).

### Unauthenticated (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 25 🔥 | should redirect away from /mystarbucks/review when not logged in | Truy cập `/mystarbucks/review` với storageState rỗng | URL không còn là `/mystarbucks/review` (middleware auth redirect) |

🔥 = tagged `@smoke` (chạy trong `pnpm test:smoke`; các test khác trong file vẫn tính `@regression`).

## Chưa cover / ngoài phạm vi

- Empty state text (ID-00104) — account test có 150+ reviews, không thể test với account hiện tại.
- API failure state (ID-00105) — cần mock server-side error, không trigger được từ E2E.
- Cursor hover check (ID-00112) — `prevent-click` dùng `pointer-events: none`, không có `cursor` CSS
  riêng — không assert được qua Playwright.
- Delete complete, test ~~19~~ (ID-00115) — tạm disabled vì mutates live data, cần re-seed.
- Edit flow end-to-end — post lại + verify updated (ID-00117) — mutates live data, không an toàn để
  automate.
