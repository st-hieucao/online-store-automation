# Test cases — API Interface (`/api/v1`)

Tóm tắt test case tự động (Playwright) cho tính năng API Interface, để verify nhanh không
cần đọc code. Cập nhật bởi skill `/summarize-test` — mỗi khi thêm/sửa test trong feature này, tìm
file này để cập nhật thay vì tạo file mới.

## item-api.spec.ts

Spec: [tests/e2e/api/item-api.spec.ts](../../tests/e2e/api/item-api.spec.ts)
Page/Component Object: [tests/api/item-api.client.ts](../../tests/api/item-api.client.ts)

Đây là nhóm test **HTTP thuần** (không mở browser) — gọi endpoint qua `APIRequestContext`, kiểm tra
`200` + đúng format response + trường primary-data có mặt/đúng kiểu + body ổn định qua nhiều lần gọi.
Mỗi test có 3 `test.step`: (1) status + top-level shape, (2) primary data trên item mẫu, (3) gọi 3
lần song song và so khớp deep-equal sau khi bỏ trường `current_timestamp`.

### Product List — /api/v1/list (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 1 🔥 | ID-00138 single param returns a well-formed list | GET `/list?category_code=beans` | 200; top-level keys đúng `{count, current_timestamp, item, aggs}`; `count` là number; item mẫu có `item_code`/`item_name` (string, non-empty), `price_in_vat` (number), `image_url` (string); 3 lần gọi trả body giống hệt |
| 2 | ID-00139 multiple params returns a well-formed list | GET `/list?category_code=beans&brand_code=starbucks-coffee` | Như trên với 2 tham số; format + primary data + ổn định qua 3 lần gọi |

### Product List Preview — /api/v1/preview/list (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 3 🔥 | ID-00140 multiple params returns a list with a validity window | GET `/preview/list?category_code=beans&brand_code=starbucks-coffee` | 200; shape `{count, current_timestamp, item, aggs}`; item mẫu có primary data (`image_url`) **và** hai trường cửa sổ hiệu lực `start_timestamp`/`end_timestamp`; ổn định qua 3 lần gọi |

### Product List (other) — /api/v1/list_other (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 4 🔥 | ID-00141 single param returns a well-formed list | GET `/list_other?category_code=beans` | 200; shape `{count, current_timestamp, item}` (không có `aggs`); item mẫu có `item_code`/`item_name`/`price_in_vat` và `image_url_grid`; ổn định qua 3 lần gọi |
| 5 | ID-00142 multiple params returns a well-formed list | GET `/list_other?category_code=beans&inventory_quantity=true` | Như trên với filter tồn kho; format + primary data + ổn định |

### Product List (other) Preview — /api/v1/preview/list_other (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 6 | ID-00143 multiple params returns a list with a validity window | GET `/preview/list_other?category_code=beans&online_store=true` | 200; shape `{count, current_timestamp, item}`; item mẫu có primary data (`image_url_grid`) **và** `start_timestamp`/`end_timestamp`; ổn định qua 3 lần gọi |

> Dùng `online_store=true` thay cho `inventory_quantity` như các endpoint khác: dữ liệu preview không
> có tồn kho live nên filter tồn kho trả list rỗng; `online_store` là tham số preview hợp lệ trả về rows.

### Request by Jancode — /api/v1/skus (2 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 7 🔥 | ID-00144 single jancode returns its sku | GET `/skus?sku_code[]=4524785366367` | 200; shape `{count, current_timestamp, sku}`; `count` = 1 (đúng số jancode gửi lên); sku mẫu có `sku_code`/`item_name`/`price_in_vat`/`image_url_grid`; ổn định qua 3 lần gọi |
| 8 | ID-00145 multiple jancodes return their skus | GET `/skus?sku_code[]=…` với 3 jancode | 200; `count` = 3 (đúng số jancode gửi lên); primary data trên sku mẫu; ổn định qua 3 lần gọi |

### Pairing — /api/v1/pairing (1 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 9 🔥 | ID-00146 category code returns a pairing list | GET `/pairing?category=beans` | 200; body là **mảng thuần** (không có wrapper object) và non-empty; mỗi phần tử có `item_code`/`item_name`/`image_url_grid`; ổn định qua 3 lần gọi |

> Toàn bộ nhóm test này phụ thuộc dữ liệu catalog **live** (`dev.menu.starbucks.co.jp`): danh mục
> `beans`/brand `starbucks-coffee` phải còn hiệu lực, và các jancode `4524785366367` / `4524785492486`
> / `4524785528765` phải còn trong catalog. Assertion primary-data cố ý **data-agnostic** (chỉ kiểm
> kiểu + non-empty, không hardcode giá trị sản phẩm) để chịu được thay đổi catalog. Các endpoint gọi
> kèm header User-Agent trình duyệt để vượt qua CloudFront WAF (thiếu UA sẽ bị 403).

🔥 = tagged `@smoke` (chạy trong `pnpm test:smoke`; các test khác trong file vẫn tính `@regression`
trừ khi ghi chú khác). 1 smoke cho mỗi endpoint riêng biệt (list / preview/list / list_other / skus /
pairing).

## Chưa cover / ngoài phạm vi

- Negative / validation cases (404 khi `category_code` không hợp lệ hoặc hết hạn, 400 khi thiếu tham
  số bắt buộc, từ chối enum sai) — cố ý bỏ qua batch này theo phạm vi đã chốt "chỉ đúng 9 sheet ID"
  (happy-path only).
- `/api/v1/preview/list_other` với `inventory_quantity` — dữ liệu preview không có tồn kho live nên
  filter này trả list rỗng; không kiểm được ở tầng E2E nếu không có dữ liệu preview có tồn kho.
- Kiểm tra chi tiết nội dung `aggs` (facet/aggregation), phân trang (`limit`/`start`), và các trường
  giá phụ (`price_in_vat_min`/`max`/`price_starts_from`) — ngoài phạm vi 9 sheet ID, chỉ verify
  primary-data cốt lõi.
