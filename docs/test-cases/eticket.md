# Test cases — E-Ticket (`/ticket_items?discount_code=`)

Tóm tắt test case tự động (Playwright) cho tính năng E-Ticket, để verify nhanh không cần đọc code.
Cập nhật bởi skill `/summarize-test` — mỗi khi thêm/sửa test trong feature này, tìm file này để cập
nhật thay vì tạo file mới.

Route công khai (không cần login cho bất kỳ case nào); list chỉ render khi `discount_code` hợp lệ,
ngược lại hiện empty state chung. Test data đã verify, nhiều trang: `884` → "Birthday Reward",
`1545` → "quyennene", `600` → "BO_UT_Test QQne", `000000` → không hợp lệ.

## eticket.spec.ts

Spec: [tests/e2e/eticket/eticket.spec.ts](../../tests/e2e/eticket/eticket.spec.ts)
Page/Component Object: [tests/pages/eticket.page.ts](../../tests/pages/eticket.page.ts), [tests/pages/components/sidebar-filter.component.ts](../../tests/pages/components/sidebar-filter.component.ts), [tests/pages/components/product-list.component.ts](../../tests/pages/components/product-list.component.ts), [tests/pages/components/pagination.component.ts](../../tests/pages/components/pagination.component.ts)

### SEO & breadcrumb (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 1 🔥 | should show the SEO title ending with the brand name | Mở `/ticket_items?discount_code=884` | `<title>` kết thúc bằng "スターバックス コーヒー ジャパン" |
| 2 | should show the breadcrumb as Home / マイページ / My Ticket / {ticketKindName} | Mở list với code hợp lệ | Breadcrumb đúng thứ tự `Home / マイページ / My Ticket / Birthday Reward` (crumb cuối = tên ticket kind) |

### eTicket types (3 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 3 🔥 | should render the ID-00122 eTicket list with its ticket-kind title | Mở list Type 1 (code `884`) | Tiêu đề ticket kind = "Birthday Reward" + có ít nhất 1 sản phẩm |
| 4 | should render the ID-00123 eTicket list with its ticket-kind title | Mở list Type 2 (code `1545`) | Tiêu đề = "quyennene" + có ít nhất 1 sản phẩm |
| 5 | should render the ID-00124 eTicket list with its ticket-kind title | Mở list Type 3 (code `600`) | Tiêu đề = "BO_UT_Test QQne" + có ít nhất 1 sản phẩm |

> Test #3–5: khác với chỉ check URL, các test này assert cả tên ticket kind + list render — 3 code
> do team cung cấp, phụ thuộc dữ liệu coupon condition thật trên `dev.menu.starbucks.co.jp`.

### Search form & result field UI (3 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 6 | should render the default sidebar filter sections | Mở list, kiểm tra sidebar mặc định | Hiện đủ 5 section カテゴリー / 取り扱い場所 / オンラインストア / ブランド / 価格 |
| 7 🔥 | should render name, price, and image for each product card | Mở list, kiểm tra từng product card | Mỗi card có tên (non-empty); ít nhất 1 giá đúng định dạng `¥1,234`/`¥1,234~¥5,678`; ít nhất 1 ảnh có `src` thật |
| 8 | should render card tags when present (ROASTERY TOKYO / online-store / limited-store) | Mở list, kiểm tra các badge trên card | Assert-if-present: không ép card cụ thể phải có badge, nhưng badge nào có render thì mọi instance phải có text non-empty |

### Filter tags & search behavior (5 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 9 | should show a removable filter tag and drop it from the URL when removed | Chọn brand "STARBUCKS COFFEE" → rồi xóa tag vừa tạo | Chọn → `brand_code` vào URL + tag hiện trong `.tag-carousel`; xóa tag → `brand_code` biến mất + tag không còn |
| 10 | should search by category and keep the discount_code | Click category "コーヒー豆" (radio) | `category_code=beans` vào URL, `discount_code` được giữ nguyên |
| 11 | should honor an inventory (在庫あり) deep-link and keep the discount_code | Deep-link `inventory_quantity=true` | Param `inventory_quantity=true` được giữ, `discount_code` giữ nguyên, section オンラインストア vẫn hiện |
| 12 | should search by another condition (brand) | Click brand "STARBUCKS COFFEE" (radio) | `brand_code=starbucks-coffee` vào URL, `discount_code` giữ nguyên |
| 13 | should combine multiple search conditions (category + inventory) via deep-link | Deep-link `category_code=beans` + `inventory_quantity=true` | Cả 2 param cùng tồn tại trong URL + `discount_code` giữ nguyên |

> Test #11, #13 assert bằng deep-link thay vì click: checkbox オンラインストア là input multi-value
> được dựng lại lúc load trang, click không đẩy param vào URL một cách ổn định trên trang eTicket —
> deep-link là cách ổn định, data-agnostic để chứng minh search theo inventory/đa điều kiện hoạt
> động. Category/brand (radio, #10/#12) vẫn assert bằng click thật. Cả 5 test chỉ assert *cơ chế*
> search (param vào URL + `discount_code` được giữ), không hardcode sản phẩm cụ thể phải xuất hiện —
> tránh brittle trên catalog live.

### Redirection (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 14 🔥 | should navigate to the product detail with discount_code when a card is clicked | Click card đầu tiên trong list | Điều hướng tới `/{item_code}?discount_code=884` — khớp đúng `href` thật của card đã click |

> Trang SSR rồi hydrate: `href` ban đầu của card là `discount_code=null`, chỉ đổi sang code thật sau
> khi Vue hydrate client-side. Page Object đợi `href` đổi sang code thật trước khi tương tác.

### Pagination (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 15 | should keep the discount_code when navigating to page 2 | Từ trang 1, chọn trang 2 qua dropdown | URL có `page=2` và `discount_code` được giữ qua các trang |
| 16 | should disable prev on the first page and next on the last page | Ở trang đầu và trang cuối | Nút Prev bị disable ở trang đầu; nút Next bị disable ở trang cuối |

### Empty state (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 17 🔥 | should show the no-result page for an invalid discount_code | Mở list với code không hợp lệ (`000000`) | Hiện trang no-result ("条件に一致する商品は見つかりませんでした"); ẩn cả product grid lẫn pagination |

### Mobile (1 case, viewport 390×844)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 18 | should open the filter drawer when tapping the 絞り込み button | Tap nút "絞り込み" trên SP | Drawer filter mở (`.sidebar.sp` có class `show`) + overlay hiện |

🔥 = tagged `@smoke` (chạy trong `pnpm test:smoke`; các test khác trong file vẫn tính `@regression`).

## Chưa cover / ngoài phạm vi

- Chỉ verify 3 discount_code type (Birthday Reward / quyennene / BO_UT_Test QQne) do team cung cấp —
  không bao phủ hết mọi loại ticket-kind có thể tồn tại trên hệ thống thật.
- Badge hiển thị trên card (ROASTERY TOKYO / online-store / limited-store) chỉ assert-if-present —
  phụ thuộc dữ liệu catalog thật, không đảm bảo luôn có ít nhất 1 card mang badge để test.
- Sort dropdown không áp dụng cho màn này (khác Search/Review List) — trang eTicket không có control
  sort riêng theo source hiện tại.
