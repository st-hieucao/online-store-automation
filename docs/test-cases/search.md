# Test cases — Search (`/search`)

Tóm tắt test case tự động (Playwright) cho tính năng Search, để verify nhanh không cần đọc code.
Cập nhật bởi skill `/summarize-test` — mỗi khi thêm/sửa test trong feature này, tìm file này để cập
nhật thay vì tạo file mới.

## sidebar.spec.ts

Spec: [tests/e2e/search/sidebar.spec.ts](../../tests/e2e/search/sidebar.spec.ts)
Page/Component Object: [tests/pages/search.page.ts](../../tests/pages/search.page.ts), [tests/pages/components/sidebar-filter.component.ts](../../tests/pages/components/sidebar-filter.component.ts)

### Desktop (9 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 1 | should apply category filters immediately and toggle dependent sections | Mở `/search`, kiểm tra 5 section mặc định hiển thị, chọn category "ビバレッジ メニュー" | URL cập nhật `category_code` ngay lập tức; section オンラインストア/価格 ẩn, ブランド vẫn hiện |
| 2 | should reveal coffee-specific filters for beans category | Chọn category "コーヒー豆" | Các section riêng cho cà phê hiện ra (ロースト, ブレンド, sinh地, 酸味, コク, 種類...); 商品仕様 vẫn ẩn |
| 3 | should drop paging when applying a new desktop category filter | Vào `?page=3`, sau đó chọn category mới | Tham số `page` bị xoá khỏi URL khi đổi filter |
| 4 | should apply the purchase-location filter, which stays visible regardless of category | Chọn 1 option bất kỳ (khác "すべて") trong 取り扱い場所, sau đó chuyển sang category ビバレッジ | `purchase_methods` set đúng giá trị; section luôn hiện dù category khác đang ẩn section khác |
| 5 🔥 | should apply brand and price as independent single-select filters and combine price with a category | (a) chọn brand rồi reset về "すべて"; (b) đổi price qua lại 2 mức; (c) chọn category + giữ price | brand/price set đúng & reset đúng; category + price cùng tồn tại trên URL |
| 6 | should toggle both online-store checkboxes independently and together | Tick "在庫あり" rồi tick thêm "オンライン商品" | 2 checkbox độc lập, cả 2 param cùng `=true` khi tick cả hai |
| 7 | should combine multiple checkboxes within one bean-classification section | Trong category コーヒー豆, tick 2 mức roast (Blonde + Dark) | `bean_classification` chứa cả 2 giá trị (nối bằng dấu phẩy) |
| 8 | should only show the 商品仕様 section for tumbler/mug categories | So sánh category コーヒー豆 vs タンブラー＆マグカップ | Section 商品仕様 chỉ hiện với category tumbler/mug |
| 9 | should drop a filter param from the URL when selecting a category that hides its section | Set `price` khi chưa chọn category, sau đó chọn category ビバレッジ (không hỗ trợ price) | `price` bị xoá khỏi URL sau khi đổi category |

> Test #4 phụ thuộc dữ liệu catalog thật (danh sách 取り扱い場所 load động theo môi trường, không cố
> định). Test #5 cố tình không kết hợp brand+price+category cùng lúc: một khi đã chọn 1 brand thì
> các brand khác bị disable (không click được), và tổ hợp brand+category+price cụ thể có thể ra 0
> sản phẩm thật — nên chỉ verify category+price cùng lúc, brand test riêng.

### Applied filter tags (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 10 🔥 | should show one removable tag per applied filter and remove only the deleted one | Chọn category + brand → tag hiện đủ 2; xoá tag brand | Cả 2 filter hiện thành tag riêng; xoá 1 tag (nút x) chỉ mất filter đó, category vẫn còn |

### Mobile (5 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 11 | should defer filter application until submit in the mobile drawer | Mở drawer, chọn category, chưa submit; sau đó bấm "絞り込む" | URL chưa đổi trước khi submit; sau submit thì URL + `page=1` cập nhật, drawer đóng |
| 12 | should close the mobile drawer without mutating URL when dismissed | Chọn category trong drawer, đóng bằng nút X | URL không đổi, drawer đóng |
| 13 | should close the mobile drawer without mutating URL when the overlay backdrop is clicked | Giống trên nhưng đóng bằng click ra ngoài overlay | URL không đổi, drawer đóng |
| 14 | should keep unsubmitted selections checked after closing and reopening the drawer | Chọn category, đóng (không submit), mở lại drawer | Option vừa chọn vẫn đang được check (state cục bộ không bị reset) |
| 15 | should submit multiple filters selected in the drawer together | Chọn category + brand trong drawer, submit 1 lần | Cả 2 param cùng xuất hiện trên URL sau submit |

🔥 = tagged `@smoke` (chạy trong `pnpm test:smoke`; các test khác trong file vẫn tính `@regression`).

## search-results.spec.ts

Spec: [tests/e2e/search/search-results.spec.ts](../../tests/e2e/search/search-results.spec.ts)
Page/Component Object: [tests/pages/search.page.ts](../../tests/pages/search.page.ts), [tests/pages/components/sort-select.component.ts](../../tests/pages/components/sort-select.component.ts), [tests/pages/components/pagination.component.ts](../../tests/pages/components/pagination.component.ts), [tests/pages/components/product-list.component.ts](../../tests/pages/components/product-list.component.ts)

### Search bar (3 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 1 🔥 | should keep the URL unchanged while typing and only navigate on submit | Ở page=2, gõ từ khoá "コーヒー", chưa submit; sau đó nhấn Enter | Gõ chữ không đổi URL; sau submit `query` xuất hiện đúng giá trị và `page` bị xoá |
| 2 | should truncate a keyword longer than 100 characters when submitted | Gõ chuỗi 150 ký tự, submit | `query` trên URL bị cắt còn đúng 100 ký tự |
| 3 | should clear the input without changing the URL until the next submit | Vào `/search?query=...`, bấm nút xoá (X) | Input hiển thị trống, nhưng URL vẫn giữ `query` cũ tới lần submit tiếp theo |

### Sort (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 4 🔥 | should update the sort query param when changing sort order | Đổi sort sang "価格が高い順" rồi "価格が安い順" | `sort` param cập nhật đúng theo từng lựa chọn |
| 5 | should not reset the page number when changing sort order | Ở page=2, đổi sort | `sort` cập nhật nhưng `page=2` vẫn giữ nguyên (khác với đổi category/filter) |

> Test #4 chỉ spot-check 2/4 hướng sort (price_high, price_low) — popular/newest dùng chung cơ chế
> `Select` nên không test riêng để giảm phụ thuộc dữ liệu catalog thật.

### Pagination (3 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 6 🔥 | should keep existing params when navigating to page 2 via the page selector | Có sẵn `sort`, chọn trang 2 qua dropdown phân trang | `page=2` và `sort` cùng tồn tại trên URL |
| 7 | should disable prev on the first page and next on the last page | Kiểm tra nút Prev ở trang 1; đọc trang cuối cùng động từ dropdown rồi vào thẳng trang đó | Nút Prev disabled ở trang 1, nút Next disabled ở trang cuối |
| 8 | should move exactly one page when using the prev/next step buttons | Từ page=2 bấm Next rồi Previous | Di chuyển đúng 1 trang mỗi lần (→ page=3 → về page=2) |

> Test #7 đọc trang cuối cùng **động** từ dropdown thay vì hardcode số trang, tránh phụ thuộc vào
> tổng số sản phẩm hiện có trong catalog thật.

### Product card (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 9 🔥 | should navigate to the product detail page matching the clicked card | Click card sản phẩm đầu tiên trong lưới kết quả | Điều hướng đúng tới URL (`href`) của chính card đó |
| 10 | should render product name, price, and image content for each card | Mở `/search` (không filter) | Mọi card có tên sản phẩm không rỗng; ít nhất 1 giá hiển thị đúng định dạng `¥1,234`/`¥1,234~¥5,678`; ít nhất 1 card có ảnh (`src` không rỗng) |

> Cả 2 test trên **không** verify nội dung tag hiển thị trên card (Gold-member/custom
> bottle/personalize/drink-ticket/"ROASTERY TOKYO"...) — xem mục "Chưa cover" cuối file.

### Empty state (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 11 🔥 | should show the empty state and hide the product grid/pagination for a no-match keyword | Tìm với từ khoá chắc chắn không có kết quả | Hiện thông báo "không tìm thấy", ẩn hoàn toàn lưới sản phẩm và phân trang |

### Deep link (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 12 | should reflect query, page, and sort directly from a deep-linked URL | Mở thẳng `/search?query=...&page=2&sort=price_high` | Input từ khoá, dropdown trang, dropdown sort đều phản ánh đúng giá trị lấy từ URL |

> Deep-link ở đây không test lại `category_code` — phần đó đã được `sidebar.spec.ts` test đầy đủ qua
> các lệnh `goto({ category_code })` của nó, tránh trùng lặp.

🔥 = tagged `@smoke` (chạy trong `pnpm test:smoke`; các test khác trong file vẫn tính `@regression`).

## Chưa cover / ngoài phạm vi

- Tổ hợp filter category + purchase_method + brand + price cùng lúc (4 chiều) — brand bị disable khi
  đã chọn 1 brand khác, và tổ hợp cụ thể có thể ra 0 sản phẩm thật trên catalog live nên chỉ test tối
  đa 2–3 chiều kết hợp.
- Trạng thái disabled của 1 filter option cụ thể khi option đó có 0 sản phẩm khớp (sidebar) — cần
  fixture cố định để tái lập được, catalog thật không đảm bảo có sẵn.
- Nội dung tag hiển thị trên product card theo từng loại (Gold-member, Gold+personalize, custom
  bottle, personalize, custom+personalize, limited store, online-only, drink-ticket, "ROASTERY
  TOKYO") — cần sản phẩm mẫu cố định cho từng loại tag mà catalog thật không đảm bảo có sẵn.
- Pagination: deep-link tới `page` vượt xa tổng số trang thực tế (ví dụ `page=9999`) — hành vi disable
  nút prev/next trong trường hợp này khả năng đã đúng (component tự sửa lại qua sự kiện `pageshow`,
  không chỉ khi bfcache) nhưng chưa có test xác nhận thực tế.
- Sort dropdown: chỉ test 2/4 hướng (price_high, price_low) — popular/newest dùng chung cơ chế
  `Select` nên rủi ro thấp nhưng chưa test riêng.
