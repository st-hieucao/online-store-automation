import { searchData } from '@test-data/search.data';

export const productDetailData = {
  /**
   * Product Detail route is `/{code}` where `code` is a numeric jan_code (see
   * online-store-web `routes/web.php` → `product.show`). Matches the pathname of a landed
   * detail page while excluding `/search` and other named routes.
   */
  detailUrlPattern: /\/\d+(?:[?#]|$)/,
  /** Review-summary (C46) only renders for these categories — beverage never shows it. */
  reviewEligibleCategory: searchData.categories.tumblerMug.value,
  /** Full review-list URL for a product: `/{item_code}/review` (item_code, not the detail jan_code). */
  reviewListUrlPattern: /\/\d+\/review\/?(?:[?#]|$)/,
  text: {
    /** `.product-information__supplement--notice` on the detail page. */
    taxIncluded: '税込',
    /** C55 recommendation carousel heading. */
    relatedHeading: 'こちらも一緒にいかがでしょうか',
    /** C46 see-all link (populated branch) and empty-state link. */
    seeAllReviews: 'すべてのレビューを見る',
    emptyReviewsLink: '0件のレビュー',
    breadcrumbHome: 'Home',
    /** Add-to-cart CTA (ButtonPurchase, non-personalize). */
    addToCart: 'カートに入れる',
    /** QuickCart confirmation title + proceed link. */
    addedToCart: 'カートに追加されました',
    proceedToCart: '購入に進む',
    /** Out-of-stock restock CTA (ItemC20C21). */
    restockNotice: '再入荷お知らせ',
    /** Gold-member product, guest (not logged in) CTA — goldAccessButton.js LOGIN_TO_ORDER. */
    loginToOrder: 'ログインして注文',
    /** Multi-variant overlay heading (MultipleProduct.vue). */
    selectProductType: '商品タイプを選択',
  },
  /** Detail price element renders `¥1,234`, optionally with a `〜` "starts from" suffix. */
  priceFormat: /^¥[\d,]+〜?$/,
  /**
   * eTicket context: opening a product detail with a coupon `discount_code`. `884` is a valid
   * staging coupon (`Birthday Reward`, 20 eligible products); `3450000000003` (LTest_Product Normal
   * 003) is a clean 1-SKU eligible product. Re-verify if a test starts failing — coupons can expire.
   */
  eticket: {
    discountCode: '884',
    ticketKindName: 'Birthday Reward',
    product: '3450000000003',
  },
  /**
   * Guest add-to-cart with a `discount_code` redirects to the barista/login flow, which lands on a
   * cross-domain login URL — so the pattern allows both the internal redirect and the external host.
   */
  loginRedirectUrlPattern: /login2\.starbucks\.co\.jp\/login|\/redirect-barista/,
  /**
   * Pinned staging products per CTA state (verified live against `dev.menu.starbucks.co.jp`). These
   * are purpose-built `FrontEnd Only` / `GTest_` / `BO_UT_Test` fixtures whose names describe their
   * state — more stable than real catalog items. Re-verify SKU count / inventory / gift flags if a
   * test starts failing; a re-seed only needs the code swapped here.
   */
  products: {
    /** 1 SKU, in-stock, no gift, not personalizable → clean single-SKU add-to-cart. */
    singleSku: '2340000000009',
    /**
     * Non-Gold multi-SKU product (2 SKUs, in-stock): row 0 has an enabled `カートに入れる`, row 1 is
     * `名入れする` (personalize). Used both for the inline multi-SKU add (cart.spec) and the
     * `商品タイプを選択` floating overlay (cta-states.spec).
     */
    multiVariant: '4524785629905',
    /** 1 SKU, out of stock, restock_notice_flg=true → 再入荷お知らせ CTA. */
    outOfStock: '2026101604000',
    /** 1 SKU, in-stock, gift_type_2, not custom-bottle → page-body `.select--giftbox` (CustomSelect). */
    giftBox: '4524785596955',
    /** 1 SKU, in-stock, gift_type_3 → page-body `.select--wrapping` (noshi). */
    noshi: '4300515202600',
    /** Gold-member product, in-stock → guest CTA `ログインして注文` (page-body + floating). */
    gold: '5402026522001',
    /** No ONLINE_STORE purchase method → add-to-cart CTA is not rendered (Hide state). */
    noOnlineStore: '2340000000006',
    /** 2 SKUs both out of stock: first `inv 0 + restock_flg 0` (Disable), second `flg 1` (Restock). */
    addCartDisabled: '2025101200001',
  },
  /** Page-body `CustomSelect` gift-box option labels (`convertGiftBoxOpt`). */
  giftBoxOptions: {
    without: 'ボックスなし',
    with: 'ボックスあり',
  },
} as const;
