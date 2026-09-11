# Test Automation Plan — online-store-web

Source: analysis of `online-store-web` (Laravel + Inertia.js + Vue3, Starbucks Japan Online Store)
cross-referenced against current coverage in `online-store-automation`.

## 1. Current state

Automation now covers: Search (P0, §4.1 — sidebar + search bar/sort/pagination/product card/empty
state), E-Ticket (P1, §4.3), Partner/Roastery Search (P2, §4.4), Review List (P1, §4.5 — public +
authenticated Like), Review Create/Edit (P1, §4.6, auth), My Reviews (P2, §4.8, auth), and the C46
review widget embedded on Product Detail (see `docs/test-cases/product-detail.md`). See section 4
for exact per-screen coverage and remaining gaps within each.

**Still fully uncovered**: Product Detail's core purchase flow (P0 — §4.2, the biggest remaining
gap: add-to-cart, variants, gift wrap, out-of-stock, breadcrumb, related products...), Review
Complete (§4.7, P2), Thank You (§4.9, P2), and Favorite toggle (§4.10, P2).

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

**Status**: `sidebar-filter`, `product-list`, `pagination`, `sort-select` components were all built
and are reused correctly across `SearchPage`/`ETicketPage`/`PartnerSearchPage` (and `sort-select`/
`pagination` further reused by `ReviewListPage`/`MyReviewsPage`). A `review-item.component.ts` was
added later (not originally planned here) and is shared between the C46 widget and Review List.
`breadcrumbs.component.ts` was **not** built — `PartnerSearchPage` and `ETicketPage` each implement
their own inline `expectBreadcrumb(labels)` instead; low priority to extract now since it's only 2
small, near-identical implementations.

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

**Note**: the C46 review widget embedded on this page (large categories `tumblermug`/`goods`/`brewing`)
IS covered separately — see [tests/e2e/product-detail/{c46,c46.auth}.spec.ts](../tests/e2e/product-detail/)
and `docs/test-cases/product-detail.md`. This partially satisfies the "Rating & review summary"
bullet below. Everything else on this page (the actual purchase flow) remains **entirely uncovered**
— this is the single biggest gap left in the whole plan (P0, core revenue flow).

- [ ] Displays correct basic info: name, price (with tax), image carousel navigable.
- [ ] Add to cart — single-SKU product: clicking CTA → `FloatingCart`/`QuickCart` quantity updates.
- [ ] Add to cart — multi-variant product (C20/C21 `MultipleProduct`): select variant → select
      size/temperature (C05/C08) → successfully added to cart.
- [ ] Add-to-cart error case (out of stock / API error): `ErrorMsg` / `ErrorDialog` show correctly,
      with retry.
- [ ] Gift wrap / Noshi (C22): selecting a wrap option sets the correct value before adding to cart.
- [ ] Rating & review summary render correctly (average score, 3 latest reviews) + link to Review
      List — **partially covered** by the C46 tests: review-count link, "レビューを投稿する" button,
      at least one review item, and "すべてのレビューを見る" link are all asserted; average score
      display and the exact "3 latest reviews" count are NOT separately asserted.
- [ ] Breadcrumb correct for the product's category.
- [ ] Out-of-stock / not-yet-released / lottery product: CTA state changes accordingly (disabled,
      restock button...).
- [ ] Partner variant (`/partner/{code}`): no Favorite button, different pricing rules (if any
      observable difference).
- [ ] Preview variant (`/preview/{code}`): purchase not allowed (no cart flow) — view only.
- [ ] Related products carousel (C18/C19): displays, click navigates correctly.
- [ ] Responsive mobile: `FloatingCart` sticks in the correct position on scroll.

### 4.3 E-Ticket / Coupon listing (`/ticket_items?discount_code=`) — P1

- [x] Valid discount_code → shows the correct ticket-kind title + list of eligible products
      (covered for 3 types: 884 "Birthday Reward", 1545 "quyennene", 600 "BO_UT_Test QQne").
- [x] Invalid/expired discount_code → the real behavior is the generic **no-result empty state**
      (`.empty-value` + `条件に一致する商品は見つかりませんでした`), not a distinct error message.
- [x] Sidebar filter behaves like Search (reuses `SidebarFilterComponent` unchanged). Note: the
      inventory/online-store **checkbox** param is reconstructed on load — asserted via deep-link,
      not click (radio category/brand assert via click). See `tests/e2e/eticket/eticket.spec.ts`.
- [x] Product card tags (drink-ticket, ROASTERY TOKYO, online-store, limited-store) — asserted
      assert-if-present (badge presence depends on the live catalog).
- [x] Pagination works correctly, keeps `discount_code` across pages.
- Also covered: SEO title, breadcrumb (Home/マイページ/My Ticket/{ticketKindName}), search-result
  field UI (name/price/image), SP filter-button drawer open, applied-filter tag show/remove,
  card→Product-Detail redirection carrying `discount_code`. Route is **public** (no auth).

### 4.4 Partner/Roastery Search (`/partner`, `/partner/{partner}`) — P2

Covered — see [tests/e2e/partner/partner-search.spec.ts](../tests/e2e/partner/partner-search.spec.ts)
(11 tests) and `docs/test-cases/partner.md`.

- [x] `/partner/roastery` and `/partner/limited` render a product list (count > 0, correct card
      quality: names/prices/images) — **not** verified against a specific expected product set per
      partner, just that a well-formed list renders. `/partner/limited` only checked at basic
      presence level (1 card visible), not the same full card-quality depth as `/partner/roastery`.
- [x] No sidebar filter (unlike Search) — confirmed absent on both partner routes.
- [x] "ROASTERY TOKYO" badge displays correctly when applicable — assert-if-present (depends on live
      catalog having a matching product).
- [x] Product card has no "custom bottle" tag (only personalization/limited/online-only).
- [ ] Empty state when a partner has no products — **not covered**, can't control live-catalog
      product count in E2E. Also: the bare `/partner` route 404s on staging, so it isn't tested at all.

### 4.5 Review List (`/{jan_code}/review`) — P1

Covered — see [tests/e2e/reviews/{review-list,review-list.auth}.spec.ts](../tests/e2e/reviews/)
(9 + 1 disabled tests) and `docs/test-cases/reviews.md`.

- [x] With reviews: list renders, rating, post date, content ("see more" link when long). Reviewer
      name asserted as non-empty text — no separate assertion for the avatar image specifically.
- [x] Sort dropdown — spot-checked 2 directions (最も参考になった/helpful, 評価が高い順/rating_high),
      not the full option list (not literally "most helpful / newest / oldest" as originally listed
      here — the real option set differs, see `reviews.md`).
- [x] Pagination works (prev/next disabled at boundaries, page navigation).
- [x] No reviews: empty state text + hides sort/pagination; "post" link visible.
- [ ] "Post review" button navigates correctly to `/{jan_code}/review/create` — only the **guest**
      redirect-to-login behavior is tested; clicking it while logged in isn't separately verified.
- [x] Guest (not logged in): Like redirects to login on click.
  - [ ] Guest Report button — **not covered**, no Report test exists at all (guest or logged in).
- [x] Logged in: Like increments the count correctly (±1 relative check) — currently `test.skip`'d
      in code with no reason given, needs re-enabling or an explanation.
  - [ ] Report opens a modal, submits successfully — **not covered**.
- [ ] Responsive: product showcase layout position changes (left/top) per breakpoint — not covered.

### 4.6 Review Create/Edit (`/{jan_code}/review/create`, `/{jan_code}/review/{code}/edit`) — P1 (auth)

Covered — see [tests/e2e/reviews/review-create.auth.spec.ts](../tests/e2e/reviews/review-create.auth.spec.ts)
(11 tests) and `docs/test-cases/reviews.md`.

- [x] No nickname yet: Confirm/Submit button disabled + shows a nickname-registration link.
- [x] Rating validation: must select stars before Confirm.
- [x] Title validation: max length (>50 chars disables submit, char counter confirmed >50) —
      **not** covered: min length, rejecting emoji/special chars/line breaks specifically.
- [x] Content validation: length boundaries (<25 and >400 chars disable submit) — **not** covered:
      rejecting emoji specifically.
- [x] Clicking "Confirm" (valid form) → moves to the Confirm step (`#confirm`) showing the entered
      data correctly.
- [x] Clicking "Back to edit" from Confirm → returns to the Form (`#confirm` removed from URL) —
      **not** separately verified that the previously-entered data is still there after returning.
- [ ] Submitting at the Confirm step → navigates to the Complete page; new review appears (or is
      pending moderation — confirm with BE) — **deliberately not automated**, to avoid accumulating
      test reviews on staging. Verify the Complete page manually.
- [x] Edit mode: form pre-fills correctly with the existing review data.
- [ ] Direct access while not logged in → correct redirect flow (barista OAuth) — **not covered**
      for this route specifically (Review List and My Reviews each have their own guest-redirect
      test, but Create/Edit doesn't).

### 4.7 Review Complete (`/{jan_code}/review/create/complete`) — P2 (auth)

- [ ] Shows the success message + CTA back to product/review list works correctly.

### 4.8 My Reviews (`/mystarbucks/review`) — P2 (auth)

Covered — see [tests/e2e/my-reviews/my-reviews.auth.spec.ts](../tests/e2e/my-reviews/my-reviews.auth.spec.ts)
(25 tests) and `docs/test-cases/my-reviews.md`.

- [x] "Newest"/"Oldest" tabs switch order correctly — tab switch is client-side only (both lists are
      already loaded server-side), so there's no real "refetch" to verify, just the correct list/URL
      swap.
- [x] Pagination works (prev/next disabled at boundaries, page navigation, dynamic last-page).
- [x] Edit → navigates correctly to an edit URL matching the `/review/{code}/edit` pattern.
- [x] Delete → opens `ConfirmModal` with the correct message. **Not** covered: actually confirming
      the delete → review disappearing + success message (commented out in code — mutates live data,
      needs a re-seed mechanism first).
- [ ] Empty state when the user has no reviews — **not covered**, the test account always has 150+
      reviews.
- [x] Access while not logged in → redirect confirmed.

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

- ✅ Auth is solved: `tests/e2e/auth/auth.setup.ts` (a Playwright `setup` project, not the originally
  imagined `tests/fixtures/auth.fixture.ts`) logs in once via `AUTH_LOGIN_URL`/`AUTH_USERNAME`/
  `AUTH_PASSWORD`, saves `storageState`, and `chromium:auth`-tagged specs depend on it and reuse the
  session — same goal as originally planned, different mechanism.
- ✅ Built: `product-detail.page.ts`, `review-list.page.ts`, `review-form.page.ts`,
  `my-reviews.page.ts`, `eticket.page.ts`, `partner-search.page.ts`. **Still missing**:
  `thank-you.page.ts` (Thank You page, §4.9, not started).
- `tests/pages/components/*` as listed in section 3 — see status note there.
- ✅ Test-data built: `search.data.ts`, `my-reviews.data.ts`, `eticket.data.ts`, `review.data.ts`
  (covers review content + `REVIEW_PRODUCT_CODE_WITH_REVIEWS`/`REVIEW_PRODUCT_CODE_NO_REVIEWS`/
  `REVIEW_EDIT_PATH` env vars). **Still missing**: a dedicated `product.data.ts` for Product Detail
  (sample product codes per type — single SKU, multi-SKU, custom bottle, out of stock, partner,
  preview) once §4.2 work starts.

## 6. Suggested rollout phases

1. **Phase 0 — Foundation**: ✅ done — `SidebarFilterComponent`, `ProductListComponent`,
   `PaginationComponent`, `SortSelectComponent` built and reused; `search.page.ts` composes them.
   `BreadcrumbsComponent` skipped (see §3 status note).
2. **Phase 1 (P0)**: ⚠️ half done — Search (§4.1) is complete. **Product Detail (§4.2) is still
   entirely uncovered except for the C46 widget** — this is now the single biggest gap in the whole
   plan and should be the next priority.
3. **Phase 2 (P1, no auth)**: ✅ done — E-Ticket (§4.3) and Review List (§4.5, public parts) both
   covered, reusing the Phase 0 components as planned.
4. **Phase 3 (auth)**: ✅ mostly done — `auth.setup.ts` built (Playwright `setup` project +
   `chromium:auth` dependency, storageState-based, not the originally-imagined `auth.fixture.ts` but
   the same idea). Review Create/Edit (§4.6) and My Reviews (§4.8) both covered. **Favorite (§4.10)
   still not started.**
5. **Phase 4 (remaining P2)**: ⚠️ partially done — Partner Search (§4.4) covered. **Review Complete
   (§4.7) and Thank You (§4.9) not started.**

## 7. Risks / dependencies to confirm with the team before coding

- Test login mechanism (Barista OAuth via another domain) — need a test account + a fast way to get
  a session (API login or cookie injection) to avoid slow/flaky auth tests.
- Does a newly posted review need moderation before it's shown publicly — affects how assertions are
  written after submit.
- Are feature flags `hide_feature_favorite` / `hide_feature_recommendation` toggled differently
  across local/stg/prod — determines which environment to run these tests against.
- Stable test data on staging (a fixed jan_code with existing reviews, images, multi-SKU variants...)
  — need seed data or a stable real product on `dev.menu.starbucks.co.jp`.
