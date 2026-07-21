# Test Automation Plan — online-store-web

Source: analysis of `online-store-web` (Laravel + Inertia.js + Vue3, Starbucks Japan Online Store)
cross-referenced against current coverage in `online-store-automation`.

## 1. Current state

Automation currently has **only 1 spec**: [tests/e2e/search/sidebar.spec.ts](../tests/e2e/search/sidebar.spec.ts)
— testing sidebar filter behavior (desktop + mobile) on `/search`. Every other screen in
`online-store-web` has no test coverage yet.

## 2. Screen map (route → page component → priority)

| # | Screen | Route | Page component (online-store-web) | Priority | Auth required? |
|---|---|---|---|---|---|
| 1 | Product Search | `/search` | `Pages/Search/Index.vue` | **P0** | No |
| 2 | Product Detail | `/{code}` | `Pages/Products/Show.vue` | **P0** | No (favorite requires auth) |
| 3 | E-Ticket / Coupon listing | `/ticket_items?discount_code=` | `Pages/ETicket/Index.vue` | P1 | No |
| 4 | Partner/Roastery search | `/partner`, `/partner/{partner}` | `Pages/Search/SearchPartner.vue` | P2 | No |
| 5 | Review List (public) | `/{jan_code}/review` | `Pages/Reviews/ReviewList.vue` | P1 | No (like/report require auth) |
| 6 | Review Create/Edit | `/{jan_code}/review/create`, `/{jan_code}/review/{code}/edit` | `Pages/Reviews/ProductReview.vue` | P1 | **Yes** |
| 7 | Review Complete | `/{jan_code}/review/create/complete` | `Pages/Reviews/CompleteReview.vue` | P2 | Yes |
| 8 | My Reviews | `/mystarbucks/review` | `Pages/MyReviews/MyReviews.vue` | P2 | **Yes** |
| 9 | Thank You (order complete) | `/thankyou?order_id=` | `Pages/Thankyou/ThankYou.vue` | P2 | No |
| 10 | Favorite (toggle, not a standalone page) | inline on Product Detail | `FavoriteButton.vue`, `FavoriteDialog.vue` | P2 | **Yes** (feature flag `hide_feature_favorite`) |

> P0 = core revenue flow (search-view-buy), P1 = important supporting feature, P2 = secondary/conditional feature.

## 3. First priority: extract shared components (avoid duplication)

`SideBarPC`/`SideBarSP`, the product card grid, pagination, and sort dropdown are **reused** across
Search / ETicket / PartnerSearch. Build **component objects** shared across pages instead of copying
`SearchPage` for each:

- `tests/pages/components/sidebar-filter.component.ts` — generalize the logic currently in
  `search.page.ts` (`selectCategory`, `expectSidebarSectionVisible/Hidden`, mobile drawer) to accept
  a `root: Locator`.
- `tests/pages/components/product-list.component.ts` — product grid, tags (custom bottle/
  personalization/limited store/online-only), card click, result count.
- `tests/pages/components/pagination.component.ts`
- `tests/pages/components/sort-select.component.ts`
- `tests/pages/components/breadcrumbs.component.ts`

`SearchPage`, `ETicketPage`, `PartnerSearchPage` should then **compose** these components instead of
reimplementing them. `search.page.ts` should be refactored to use `SidebarFilterComponent`
internally (without breaking the existing spec's API).

## 4. Test case detail per screen

### 4.1 Product Search (`/search`) — P0

Already covered: category filter (desktop + mobile), section toggling by category, paging reset on
filter change, purchase-location/brand/price/online-store/bean-classification filters, applied
filter tags (show + individual removal), category-switch dropping now-hidden filter params, mobile
overlay-click close, and unsubmitted-state persistence on drawer reopen — see
[tests/e2e/search/sidebar.spec.ts](../tests/e2e/search/sidebar.spec.ts).

Also covered (see [tests/e2e/search/search-results.spec.ts](../tests/e2e/search/search-results.spec.ts)):
search bar (typing has no URL effect, submit navigates + resets page, 100-char truncation, clear
button doesn't touch the URL), sort dropdown (2 of 4 directions + page-not-reset behavior),
pagination (page-select navigation, prev/next disabled at boundaries, prev/next step buttons),
product card click-through to Product Detail, empty state, and a query+page+sort deep-link.

Still missing:
- [x] Search bar (source-verified, `Pages/Search/childComponents/SearchBar.vue`): submit-based, not
      live — typing only updates local state, URL only changes on submit (Enter) and resets `page`.
      The keyword cap is actually **100 chars** (`/.{99}./` matches 99+1), not 99 — only the
      submitted `query` param gets truncated, typing itself isn't blocked. The clear button
      (`.search-reset`) only clears the visible input/local state — it does **not** touch the URL by
      itself, only a subsequent submit does.
- [x] Applied filter tags: correct tag shown, clicking (x) removes one filter and updates URL/results.
- [x] Combining multiple filters at once — covered as category+price, and as multiple checkboxes
      within one section (online-store, bean-classification). A literal 4-way
      category+purchase-method+brand+price combo was deliberately **not** hardcoded: once a brand
      is selected, all other brand options become disabled (single-select-only, no direct
      switching), and brand+category+price combinations can have zero overlapping live products —
      both make a fixed 4-way assertion flaky against live catalog data.
- [x] Sort dropdown: changing order (spot-checked price high-to-low / low-to-high — popular/newest
      not separately covered, same `Select` mechanism) → `sort` query param updates correctly. Note:
      unlike category/filter changes, changing sort does **not** reset `page` (`updateSortValue` in
      `Index.vue` never deletes it) — this is asserted, not just noted.
- [x] Pagination (`components/partials/Pagination.vue`): page navigation keeps active filters in the
      URL, prev/next disabled at boundaries, prev/next step buttons move exactly one page. Renders
      only when there are results (hidden entirely on empty state) — asserted via the empty-state
      case. Known edge case **not** covered: prev/next disabled-state is computed once at initial
      load from the URL's `page` vs total pages, and only re-corrected via a `pageshow` listener
      (mainly fires on bfcache back/forward) — a direct deep-link to a `page` far beyond the actual
      total may show enabled buttons on first paint. Low priority (P2), deferred.
- [x] Product card: click → navigates correctly to Product Detail (`/{code}`), verified against the
      clicked card's actual `href` rather than a generic URL pattern. Also covers basic content: every
      card shows a non-empty product name, at least one price renders in the correct `¥1,234`/
      `¥1,234~¥5,678` format, and at least one card has a real (non-empty) image `src`.
  - [ ] Tag rendering by type — **deferred**, not covered. Tag types are broader than previously
        listed here: besides custom bottle / personalization / custom+personalization / limited
        store / online-only, `Index.vue`'s tag `v-else-if` chain also has a **Gold-member** tag and a
        **Gold+personalize combined** tag (checked first, highest priority), plus two independent
        overlays that can co-occur with any tag: a **drink-ticket badge** (`drink_ticket_flag`) and a
        **"ROASTERY TOKYO" brand badge** (`brand_code === 'starbucks-reserve-roastery-tokyo'`).
        Exhaustively testing every variant would need hand-picked product fixtures per tag type,
        which aren't available against the live catalog — same reasoning as the sidebar's
        brand/price/category combination trade-off above.
- [x] Empty state: no-match query → shows message + image, hides both the product grid and
      pagination. "Doesn't render a stale result sidebar" not separately re-tested here — sidebar
      behavior is out of scope for this spec (already covered in `sidebar.spec.ts`).
- [x] Deep-link: opening `/search?query=...&page=2&sort=...` directly → keyword input, current page,
      and sort dropdown all reflect the URL. Scoped to query/page/sort only — `category_code`
      deep-linking is already exercised throughout `sidebar.spec.ts`'s own `goto({ category_code })`
      calls, so it wasn't duplicated here.
- [x] Responsive: mobile filter button opens/closes the overlay correctly (X button, overlay-backdrop
      click, and submit-button close are all covered; an "open then rotate orientation" case is
      still not covered if needed later).

**Sidebar filter sections (source-verified, `online-store-web/resources/js/components/partials/SideBarPC.vue` /
`SideBarSP.vue` + `composables/useSearchFilter.js` + `utils/constant.js`):**

| Section (JP) | Type | URL param | Visible when |
|---|---|---|---|
| カテゴリー | radio, hierarchical | `category_code` | always |
| 取り扱い場所 | radio | `purchase_methods` | always |
| ブランド | radio | `brand_code` | always |
| オンラインストア | checkbox ×2 (在庫あり / オンライン商品) | `inventory_quantity`, `online_store` | no category, or category in `CATEGORIES_HAVE_FILTER.onlineStore` |
| 価格 | radio | `price` | no category, or category in `CATEGORIES_HAVE_FILTER.price` |
| スターバックスロースト | checkbox multi | `bean_classification` | beans-related categories |
| ブレンド／シングルオリジン | checkbox multi | `blend_and_single_origin` | beans-related categories |
| 生産地 | checkbox multi | `country_code_of_origin` | beans-related categories |
| 酸味 | checkbox multi | `whole_bean_acidity` | beans-related categories |
| コク | checkbox multi | `whole_bean_body` | beans-related categories |
| 種類 | checkbox multi | `grind_and_type` | beans-related + coffee/syrup categories |
| 商品仕様 | checkbox multi | `handling_md` | tumbler/mug/bottle categories only |

Notes: desktop applies filters immediately (URL update per click); mobile defers until the
"絞り込む" submit button. Closing the mobile drawer via the header X button or an overlay backdrop
click both discard unsubmitted changes without resetting the drawer's local checked state. Applied
filters show as removable tags in `.tag-carousel` (`.search-tag`, delete via
`.search-tag__delete-button`) — there is no "clear all" control, only per-tag removal. No
`data-testid` attributes exist in the sidebar; locators rely on semantic classes (`.title-filter`,
label text, `input[name="..."]`) **scoped to each section's own container** — label text is not
unique across sections (e.g. "STARBUCKS COFFEE" is both a 取り扱い場所 option and a ブランド option).

Two more live-data behaviors worth knowing before writing more sidebar tests:
- Once a category is selected, the カテゴリー list narrows to just that category's own subtree —
  other top-level categories are no longer clickable until you clear the category (via its applied
  tag) or navigate directly by URL.
- Once a radio-style filter (ブランド, 価格, 取り扱い場所) has a value, aggregation counts can disable
  the *other* options in that same section (0 matching products for that combination), so a direct
  "click option A then option B" replace test isn't reliable for every section — verify live via a
  quick disabled-state check before assuming an option is clickable.

### 4.2 Product Detail (`/{code}`) — P0

Batch 1 (display + navigation) is covered by
[display.spec.ts](../tests/e2e/product-detail/display.spec.ts) /
[navigation.spec.ts](../tests/e2e/product-detail/navigation.spec.ts) (reach a product via a real
`/search` card). Batch 2 (cart flow) is covered by
[cart.spec.ts](../tests/e2e/product-detail/cart.spec.ts), which pins staging product codes per CTA
state (single-SKU / multi-SKU / out-of-stock / gift-box / noshi) in `product-detail.data.ts` —
add-to-cart POSTs to the real cart service under a fresh anonymous `visitor_code` per test context,
so tests stay independent with no cleanup. Batch 3 (CTA states) is covered by
[cta-states.spec.ts](../tests/e2e/product-detail/cta-states.spec.ts): Gold-guest CTA, the
`商品タイプを選択` overlay, add-cart Hide/Disable states — also pinned staging codes. The page is
template-driven (`Show.vue` → `C##` by `program_id`) with **no `data-testid`**, so locators use
semantic classes: name `C12`
`.product-information__heading h1`, price `.product-information__price`, image carousel `C01`
`.image-carousel`, review summary `C46` `.review-section`, related products `C55` `.section-recommend`,
cart row `ItemC20C21` `.product-information__cartset`, confirmation `QuickCart` `.float-cart`.

- [x] Displays correct basic info: name (non-empty H1), price (at least one in `¥1,234`/`¥1,234〜`
      format), image carousel (active slide + real `img src`). Image-carousel *navigation* is
      desktop-by-nav-item (arrows are SP-only, injected into `.zoom-area`); covered only when the
      product has >1 image (runtime-skipped otherwise). Note: the tax-inclusive notice
      (`.product-information__supplement--notice`) is asserted, but it renders `v-if="isPriceInVatExist"`
      — currently relies on the first search card having a VAT price (flag for review if catalog shifts).
- [x] Add to cart — single-SKU product: click the page-body CTA (`カートに入れる`) → `QuickCart`
      confirmation (`カートに追加されました` + `購入に進む`). Also asserts a chosen quantity (via the
      page-body `CustomSelect` widget — not a native `<select>`, so `selectOption` won't drive it; the
      test clicks the trigger + option span) is reflected in the confirmation `数量`.
- [x] Add to cart — multi-SKU product: renders one `ItemC20C21` cart row per SKU (each with its own
      quantity `CustomSelect`); adds the first plain (`not_personalizable`) variant → confirmation.
      **Note:** C05/C08 are food-pairing carousels, not size/temperature selectors; there is no
      size/temperature radio.
- [x] Multi-variant `商品タイプを選択` overlay (`MultipleProduct`, Batch 3): the floating
      `.js-float-product-selection` button opens the overlay (scroll to page bottom first — the fixed
      button is pointer-intercepted by inline rows otherwise); overlay lists variant rows and adds one
      → confirmation.
- [x] Add-cart CTA states (Batch 3, `cta-states.spec.ts`): **Gold-member as guest** →
      `ログインして注文` (`.button--login-to-order`, resolves after async `/skus/user-info`); **Hide**
      when `purchase_methods` excludes ONLINE_STORE (no cart CTA); **Disable** when
      `inv 0 + restock_flg 0` (`.button--primary-S[disabled]`). `Gold会員向け` (logged-in non-gold)
      needs auth — deferred.
- [ ] Add-to-cart error case (out of stock / API error): `ErrorMsg` / `ErrorDialog` show correctly,
      with retry. *(Deferred — needs a product that forces an add-cart API error.)*
- [ ] Lottery CTA: price-only state during a lottery window. *(Deferred — no in-window lottery
      fixture on staging; the one found expired in 2024.)*
- [x] Gift wrap / Noshi: `select--giftbox` / `select--wrapping` `CustomSelect`s inside `ItemC20C21`
      (NOT C22 — C22 is taste-characteristics) render with their options (`ボックスなし`/`ボックスあり`,
      noshi variants) and are selectable. Requires a gift-eligible product whose gift SKU is **in
      stock** (`isShowAddCartOptions`), so the pinned gift codes are stock-verified.
- [x] Rating & review summary (`C46`) render: average-score stars + `{n}件` count + link to the full
      review list (`/{item_code}/review`), handling both empty (`0件のレビュー`) and populated
      branches. **Renders only for `beans`/`tealeaf`/`tumblermug`/`goods`/`brewing` categories, NOT
      beverage** — the review test navigates from `?category_code=tumblermug`.
- [x] Breadcrumb: `Home` link first, current product as the last `.current` crumb.
- [x] Out-of-stock product: renders the `再入荷お知らせ` restock CTA (`.button-restock-notice`) and
      **no** add-to-cart button (display-only, no cart write). Not-yet-released / lottery states still
      deferred.
- [ ] Partner variant (`/partner/{code}`): no Favorite button, different pricing rules (if any
      observable difference).
- [ ] Preview variant (`/preview/{code}`): purchase not allowed (no cart flow) — view only.
- [x] Related products carousel (`C55`, "こちらも一緒にいかがでしょうか"): clicking a card navigates to
      another `/{code}` detail page (JS `@click` handler, not `<a href>` — asserted via URL change).
      Runtime-skipped when the carousel isn't rendered for a product. (Was mislabeled C18/C19; C18 is
      store/rewards links, C19 is beverage pricing.)
- [ ] Responsive mobile: `FloatingCart` sticks in the correct position on scroll.
- [x] **eTicket context** (`/{code}?discount_code=`, `eticket.spec.ts`): same `/{code}` route with a
      coupon query param (`Show.vue` reads `discount_code`). Guest/no-login rows of the manual "Prd
      detail - eTicket" / "Add cart - eTicket" sheet: `discount_code` persists in the URL; detail
      renders normally (name + price); **guest add-to-cart with a discount_code redirects to login**
      (cross-domain `login2.starbucks.co.jp`, via `callApiCheckIsLogin`). Uses pinned coupon `884`
      (`Birthday Reward`) + product `3450000000003`. Logged-in add-cart/quick-cart/token rows
      (ID-0028+) need auth — deferred.

### 4.3 E-Ticket / Coupon listing (`/ticket_items?discount_code=`) — P1

- [ ] Valid discount_code → shows the correct ticket-kind title + list of eligible products.
- [ ] Invalid/expired discount_code → appropriate empty state or error message.
- [ ] Sidebar filter behaves like Search (reuse `SidebarFilterComponent`).
- [ ] Product card shows the "drink-ticket" badge correctly for eligible products.
- [ ] Pagination works correctly, keeps `discount_code` across pages.

### 4.4 Partner/Roastery Search (`/partner`, `/partner/{partner}`) — P2

- [ ] `/partner/roastery` and `/partner/limited` return the correct product set per partner.
- [ ] No sidebar filter (unlike Search) — confirm the UI doesn't render one.
- [ ] "ROASTERY TOKYO" badge displays correctly when applicable.
- [ ] Product card has no "custom bottle" tag (only personalization/limited/online-only).
- [ ] Empty state when a partner has no products.

### 4.5 Review List (`/{jan_code}/review`) — P1

- [ ] With reviews: list renders, avatar, rating, post date, content ("see more" link when long).
- [ ] Sort dropdown (most helpful / newest / oldest) changes order correctly.
- [ ] Pagination works, keeps `jan_code` in the URL.
- [ ] No reviews: empty state + "Be the first to review" CTA.
- [ ] "Post review" button navigates correctly to `/{jan_code}/review/create`.
- [ ] Guest (not logged in): Like/Report buttons are disabled or redirect to login on click.
- [ ] Logged in: Like increments the count correctly; Report opens a modal, submits successfully.
- [ ] Responsive: product showcase layout position changes (left/top) per breakpoint.

### 4.6 Review Create/Edit (`/{jan_code}/review/create`, `/{jan_code}/review/{code}/edit`) — P1 (auth)

- [ ] No nickname yet: Confirm/Submit button disabled + shows a nickname-registration link.
- [ ] Rating validation: must select stars before Confirm.
- [ ] Title validation: min/max length (≤50), real-time char counter, rejects emoji/special
      chars/line breaks.
- [ ] Content validation: 25–400 chars, real-time char counter, rejects emoji.
- [ ] Clicking "Confirm" (valid form) → moves to the Confirm step (`#confirm`) showing the entered
      data correctly.
- [ ] Clicking "Back to edit" from Confirm → returns to the Form keeping entered data.
- [ ] Submitting at the Confirm step → navigates to the Complete page; new review appears (or is
      pending moderation — confirm with BE).
- [ ] Edit mode: form pre-fills correctly with the existing review data.
- [ ] Direct access while not logged in → correct redirect flow (barista OAuth).

### 4.7 Review Complete (`/{jan_code}/review/create/complete`) — P2 (auth)

- [ ] Shows the success message + CTA back to product/review list works correctly.

### 4.8 My Reviews (`/mystarbucks/review`) — P2 (auth)

- [ ] "Newest"/"Oldest" tabs switch order correctly, refetch data.
- [ ] Pagination works.
- [ ] Edit → navigates correctly to the edit page with the right `jan_code`/`review_code`.
- [ ] Delete → opens `ConfirmModal`, confirming deletes it → review disappears from the list +
      success message.
- [ ] Empty state when the user has no reviews.
- [ ] Access while not logged in → redirect (auth middleware).

### 4.9 Thank You (`/thankyou?order_id=`) — P2

- [ ] Shows the correct `order_id` from the query param.
- [ ] Breadcrumb shows all completed checkout steps.
- [ ] CTA links (home, contact, My Starbucks) point to the correct domain (per env).
- [ ] No `order_id` → still renders reasonably (no error/crash).

### 4.10 Favorite (on Product Detail) — P2 (auth, feature-flagged)

- [ ] Feature enabled: guest clicking favorite → `FavoriteDialog` prompts login.
- [ ] Logged in: clicking favorite → icon state changes, correct API called, state persists across
      reload.
- [ ] Feature disabled (`hide_feature_favorite`): favorite button doesn't render — needs a separate
      test with the corresponding env config toggled, if staging supports it.

## 5. Additional fixtures / test-data needed

- `tests/fixtures/auth.fixture.ts` — a fixture that provides an already-logged-in `page`, reusing a
  `storageState` (log in once via barista OAuth in `globalSetup`, save the session, reuse it across
  auth-gated tests — avoid running real OAuth per test). **Needs clarification with the team**:
  is there a fixed test account on staging, and can the OAuth mechanism (redirect to another domain)
  be mocked/bypassed for the test environment.
- `tests/pages/product-detail.page.ts`, `review-list.page.ts`, `review-form.page.ts`,
  `my-reviews.page.ts`, `eticket.page.ts`, `partner-search.page.ts`, `thank-you.page.ts`.
- `tests/pages/components/*` as listed in section 3.
- `tests/test-data/product.data.ts` — sample product codes per type (single SKU, multi-SKU, custom
  bottle, out of stock, partner, preview).
- `tests/test-data/review.data.ts` — valid/invalid review content (too long, emoji...), jan_codes
  with/without existing reviews.
- `tests/test-data/eticket.data.ts` — valid/expired discount_codes for tests.

## 6. Suggested rollout phases

1. **Phase 0 — Foundation**: extract `SidebarFilterComponent`, `ProductListComponent`,
   `PaginationComponent`, `SortSelectComponent`, `BreadcrumbsComponent`; refactor `search.page.ts` to
   use them (without breaking the existing spec).
2. **Phase 1 (P0)**: complete Search (section 4.1) + Product Detail (section 4.2) — the two core
   revenue flows.
3. **Phase 2 (P1, no auth)**: E-Ticket (4.3) + Review List (4.5) — reuse the Phase 0 components.
4. **Phase 3 (auth)**: build `auth.fixture.ts` (clarify the test login mechanism first), then Review
   Create/Edit (4.6), My Reviews (4.8), Favorite (4.10).
5. **Phase 4 (remaining P2)**: Partner Search (4.4), Review Complete (4.7), Thank You (4.9).

## 7. Risks / dependencies to confirm with the team before coding

- Test login mechanism (Barista OAuth via another domain) — need a test account + a fast way to get
  a session (API login or cookie injection) to avoid slow/flaky auth tests.
- Does a newly posted review need moderation before it's shown publicly — affects how assertions are
  written after submit.
- Are feature flags `hide_feature_favorite` / `hide_feature_recommendation` toggled differently
  across local/stg/prod — determines which environment to run these tests against.
- Stable test data on staging (a fixed jan_code with existing reviews, images, multi-SKU variants...)
  — need seed data or a stable real product on `dev.menu.starbucks.co.jp`.
