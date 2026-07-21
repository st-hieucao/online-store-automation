# Test cases — Product Detail (`/{code}`)

Tóm tắt các test case tự động (Playwright) cho màn Product Detail, để verify nhanh mà không cần đọc
code. Cập nhật bởi skill `/summarize-test` — mỗi khi thêm/sửa test trong feature này, tìm file này
để cập nhật thay vì tạo file mới.

Phạm vi hiện tại: **Batch 1 — hiển thị + điều hướng** (`display.spec.ts`, `navigation.spec.ts`; tới
sản phẩm bằng cách click card thật trên `/search`) và **Batch 2 — luồng giỏ hàng** (`cart.spec.ts`;
mở thẳng mã sản phẩm staging đã ghim). Chưa cover auth (favorite). Trang là template-driven
(`Show.vue` render `C##` theo `program_id`) và **không có `data-testid`**, nên locator dùng class ngữ
nghĩa: tên `.product-information__heading h1`, giá `.product-information__price`, carousel ảnh
`.image-carousel`, review `.review-section`, sản phẩm liên quan `.section-recommend`, dòng cart
`.product-information__cartset`, panel xác nhận `.float-cart`.

## display.spec.ts

Spec: [tests/e2e/product-detail/display.spec.ts](../../tests/e2e/product-detail/display.spec.ts)
Page/Component Object: [tests/pages/product-detail.page.ts](../../tests/pages/product-detail.page.ts),
[image-carousel.component.ts](../../tests/pages/components/image-carousel.component.ts),
[breadcrumbs.component.ts](../../tests/pages/components/breadcrumbs.component.ts),
[review-summary.component.ts](../../tests/pages/components/review-summary.component.ts)

### Display (5 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 1 🔥 | should render the product name, a formatted price, and a product image | Mở `/search`, click card đầu tiên → landing trang chi tiết | H1 tên sản phẩm hiển thị & không rỗng; có ít nhất 1 giá đúng định dạng `¥1,234` / `¥1,234〜`; carousel có 1 slide `.active` với `img src` thật |
| 2 | should show the tax-inclusive price notice | Vào trang chi tiết từ card `/search` đầu tiên | Ghi chú giá đã bao gồm thuế (`.product-information__supplement--notice`) hiển thị và chứa chữ "税込" |
| 3 | should advance the active image when a product has more than one image | Vào trang chi tiết, đếm số ảnh; nếu ≥2 ảnh thì click nav item thứ 2 | Nav item được click chuyển sang trạng thái `.active` (điều hướng carousel trên desktop bằng nav item, không phải nút mũi tên) |
| 4 | should show a breadcrumb ending in the current product | Vào trang chi tiết từ card `/search` | Breadcrumb hiển thị; crumb đầu là link "Home" (có href); crumb cuối `.current` không rỗng |
| 5 | should render the review summary for a review-eligible product | Mở `/search?category_code=tumblermug`, click card đầu → trang chi tiết | Khối review (`C46`) + widget sao hiển thị; có review count (link `0件のレビュー` khi rỗng, hoặc `{n}件` khi có review) |

## navigation.spec.ts

Spec: [tests/e2e/product-detail/navigation.spec.ts](../../tests/e2e/product-detail/navigation.spec.ts)

### Navigation (3 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 6 🔥 | should land on the product detail page matching the clicked search card | Click card đầu tiên trên `/search`, lấy `href` của card | URL landing khớp đúng `href` của card đã click; tên sản phẩm trên trang chi tiết không rỗng |
| 7 | should navigate to the full review list from the review summary link | Vào trang chi tiết từ `?category_code=tumblermug`, click link review (`すべてのレビューを見る` khi có review, hoặc `0件のレビュー` khi rỗng) | Điều hướng tới URL danh sách review đầy đủ `/{item_code}/review` |
| 8 | should navigate to another product when clicking a related-products card | Vào trang chi tiết; nếu có carousel sản phẩm liên quan (`C55`) thì click card đầu tiên | URL đổi sang 1 trang chi tiết `/{code}` khác (card điều hướng bằng JS `@click`, không phải `<a href>` → assert qua URL thay đổi); tên sản phẩm mới không rỗng |

## cart.spec.ts

Spec: [tests/e2e/product-detail/cart.spec.ts](../../tests/e2e/product-detail/cart.spec.ts)
Component Object: [cart-panel.component.ts](../../tests/pages/components/cart-panel.component.ts),
[custom-select.component.ts](../../tests/pages/components/custom-select.component.ts)

Khác Batch 1: mỗi test mở thẳng 1 mã sản phẩm staging đã ghim theo trạng thái CTA (xem
`productDetailData.products`) vì loại sản phẩm (số SKU / còn hàng / quà tặng) không thể đảm bảo qua
điều hướng từ `/search`. Add-to-cart gọi API giỏ hàng thật theo cookie `visitor_code` ẩn danh — mỗi
context test mới = giỏ rỗng, nên độc lập và không cần dọn dẹp.

### Cart (7 case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 1 🔥 | should add a single-SKU product to the cart | Mở sản phẩm 1-SKU còn hàng (`2340000000009`), bấm `カートに入れる` | Panel xác nhận `QuickCart` hiện (`カートに追加されました` + link `購入に進む`); tên sản phẩm trong panel không rỗng |
| 2 🔥 | should add a variant of a multi-SKU product to the cart | Mở sản phẩm nhiều SKU (`4524785629905`) | Hiển thị đúng 2 dòng cart (`.product-information__cartset`); bấm `カートに入れる` của biến thể đầu → panel xác nhận hiện |
| 3 | should render a quantity selector on each variant row | Mở sản phẩm nhiều SKU | Có 2 dòng cart, mỗi dòng có widget chọn số lượng riêng (`.custom-select-wrap.select--S` ×2) |
| 4 | should reflect the chosen quantity in the cart confirmation | Mở sản phẩm 1-SKU, đổi số lượng sang 2 qua widget custom-select (click trigger + option, KHÔNG phải `<select>` native), rồi add | Panel xác nhận hiện `数量` = 2 |
| 5 | should show the restock CTA instead of add-to-cart for an out-of-stock product | Mở sản phẩm hết hàng có báo lại hàng (`2026101604000`) | Nút `再入荷お知らせ` (`.button-restock-notice`) hiện; **không** có nút add-to-cart (chỉ hiển thị, không ghi giỏ) |
| 6 | should render a selectable gift-box option for a gift-eligible product | Mở sản phẩm hỗ trợ hộp quà, SKU còn hàng (`4524785596955`) | `.select--giftbox` (CustomSelect) hiện và chọn được option `ボックスあり` |
| 7 | should render a selectable noshi option for a noshi-eligible product | Mở sản phẩm hỗ trợ noshi, còn hàng (`4300515202600`) | `.select--wrapping` hiện với >1 option và chọn được option thứ 2 |

## Ghi chú / cần lưu ý

- **Chạy trên môi trường thật (`dev.menu.starbucks.co.jp`), phụ thuộc dữ liệu catalog thật** — không
  dùng fixture/mock. Test tới sản phẩm qua card đầu tiên của `/search`, nên loại sản phẩm không cố
  định giữa các lần chạy.
- **Case 2 (tax notice) có phụ thuộc dữ liệu ngầm:** ghi chú thuế chỉ render khi
  `v-if="isPriceInVatExist"`. Hiện pass ổn định vì card đầu tiên của `/search` có giá VAT, nhưng nếu
  catalog thay đổi có thể cần điều hướng theo category cụ thể để đảm bảo. (Đã flag cho `/review-test`.)
- **Case 3 và 8 dùng `test.skip` runtime có chủ đích:** carousel ảnh chỉ điều hướng được khi sản phẩm
  có >1 ảnh; carousel sản phẩm liên quan (`C55`) không phải sản phẩm nào cũng render. Khi không thoả
  điều kiện, test skip thay vì assert sai — không phải bug.
- **Review summary chỉ hiển thị cho category `beans`/`tealeaf`/`tumblermug`/`goods`/`brewing`, KHÔNG
  có ở beverage** — nên case 5 và 7 điều hướng từ `?category_code=tumblermug`.
- Hai lần fail rời rạc khi chạy lặp là **timeout điều hướng/khởi tạo context** khi chạy 4 worker local
  với staging bị nghẽn (không phải fail assertion). Chạy kiểu CI (2 worker, `retries: 2`) pass toàn bộ.

**cart.spec.ts:**
- **Phụ thuộc các mã sản phẩm staging đã ghim** (`productDetailData.products`) — đều là fixture
  `FrontEnd Only` / `GTest_` / `BO_UT_Test` / hàng thật đã verify (số SKU, còn hàng, cờ quà, không
  Gold, không custom-bottle/personalize ở dòng được add). Nếu 1 fixture bị seed lại → test đỏ, chỉ cần
  đổi mã trong `product-detail.data.ts`.
- **Select ở thân trang KHÁC select ở overlay:** thân trang (`ItemC20C21`) dùng `CustomSelect` (widget
  JS, không phải `<select>` native → `selectOption()` không chạy; phải click trigger + option span).
  Component `CustomSelectComponent` scope theo `.custom-select-wrap` để không đụng overlay.
- **Overlay `商品タイプを選択` (`MultipleProduct`) KHÔNG được test:** trên desktop, nút floating bị
  content thân trang chặn pointer; UX thật hiển thị từng dòng SKU inline nên test dùng dòng inline.
- **Gift-box/noshi chỉ render khi SKU quà còn hàng** (`isShowAddCartOptions`) — mã ghim đã chọn SKU
  còn hàng; sản phẩm có SKU quà hết hàng sẽ không render select.
- Case 2 & 4 ghi thật vào giỏ hàng staging (dưới guest session dùng 1 lần), không cần dọn dẹp.

- **Chưa cover (batch sau):** add-to-cart lỗi API/retry (`ErrorDialog`), CTA gold-member/lottery,
  favorite (guest redirect + đã đăng nhập), biến thể partner (`/partner/{code}`) và preview
  (`/preview/{code}`), vị trí sticky của `FloatingCart` trên mobile.
