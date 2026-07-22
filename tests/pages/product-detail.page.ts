import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { ProductListComponent } from '@pages/components/product-list.component';
import { ImageCarouselComponent } from '@pages/components/image-carousel.component';
import { BreadcrumbsComponent } from '@pages/components/breadcrumbs.component';
import { ReviewSummaryComponent } from '@pages/components/review-summary.component';
import { CartPanelComponent } from '@pages/components/cart-panel.component';
import { CustomSelectComponent } from '@pages/components/custom-select.component';
import { ProductSelectionComponent } from '@pages/components/product-selection.component';
import { productDetailData } from '@test-data/product-detail.data';

/**
 * Product Detail (`/{code}`, `online-store-web/Pages/Products/Show.vue`). The page is
 * template-driven — child `C##` components are rendered dynamically per product type — and exposes
 * no `data-testid`, so locators rely on the semantic classes verified in each child component:
 *   - name (H1)          → C12  `.product-information__heading h1`
 *   - price (tax incl.)  → C19 / ItemC20C21  `.product-information__price`
 *   - image carousel     → C01  `.image-carousel`
 *   - review summary     → C46  `.review-section`
 *   - related products   → C55  `.section-recommend`
 *
 * Tests reach a product by clicking a real card on `/search` (no hardcoded product codes), so the
 * page composes `ProductListComponent` for that hand-off.
 */
export class ProductDetailPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly priceElements: Locator;
  readonly taxNotice: Locator;
  readonly relatedProducts: Locator;
  readonly relatedCards: Locator;
  readonly addToCartButton: Locator;
  readonly cartRows: Locator;
  readonly restockButton: Locator;
  readonly floatingVariantButton: Locator;
  readonly loginToOrderButton: Locator;
  readonly disabledAddToCartButton: Locator;
  readonly searchProductList: ProductListComponent;
  readonly imageCarousel: ImageCarouselComponent;
  readonly breadcrumbs: BreadcrumbsComponent;
  readonly reviewSummary: ReviewSummaryComponent;
  readonly cartPanel: CartPanelComponent;
  readonly productSelection: ProductSelectionComponent;
  readonly quantitySelect: CustomSelectComponent;
  readonly giftBoxSelect: CustomSelectComponent;
  readonly noshiSelect: CustomSelectComponent;

  constructor(page: Page) {
    this.page = page;
    this.productName = page.locator('.product-information__heading h1');
    this.priceElements = page.locator('.product-information__price');
    this.taxNotice = page.locator('.product-information__supplement--notice');
    this.relatedProducts = page.locator('.section-recommend');
    this.relatedCards = this.relatedProducts.locator('.recommend-item');
    // Page-body add-to-cart CTA (ItemC20C21 → ButtonPurchase, `button--primary-S`); the floating
    // variant is `.button--primary-S-floating` (`.js-float-cart` single / multi opens the overlay).
    // Page-body add-to-cart CTA (ItemC20C21 → ButtonPurchase, `button--primary-S`). Multi-SKU
    // products render one such button per in-stock variant row.
    this.addToCartButton = page
      .locator('.product-information__cartset')
      .getByRole('button', { name: productDetailData.text.addToCart });
    // One cart row per SKU (ItemC20C21). Multi-SKU products render several; a personalize SKU's row
    // shows `名入れする` instead of `カートに入れる`, so row count is the reliable "variant" signal.
    this.cartRows = page.locator('.product-information__cartset');
    this.restockButton = page.locator('.button-restock-notice');
    // The floating variant button (`.js-float-product-selection`) opens the 商品タイプを選択 overlay
    // on multi-SKU products. Scoped to the <button> to avoid the QuickCart/FavoriteDialog <a> links
    // that share `.button--primary-S-floating`.
    this.floatingVariantButton = page.locator('button.js-float-product-selection');
    // Gold-member product, guest → CTA label `ログインして注文` (goldAccessButton.js), both in the
    // page-body cart row and the floating bar.
    this.loginToOrderButton = page.getByRole('button', { name: productDetailData.text.loginToOrder });
    // Add-cart button rendered but disabled (inv 0 + restock_flg 0 → isAddCartDisabled).
    this.disabledAddToCartButton = page.locator(
      '.product-information__cartset button.button--primary-S[disabled]',
    );
    this.searchProductList = new ProductListComponent(page);
    this.imageCarousel = new ImageCarouselComponent(page);
    this.breadcrumbs = new BreadcrumbsComponent(page);
    this.reviewSummary = new ReviewSummaryComponent(page);
    this.cartPanel = new CartPanelComponent(page);
    this.productSelection = new ProductSelectionComponent(page);
    this.quantitySelect = new CustomSelectComponent(page, 'select--S');
    this.giftBoxSelect = new CustomSelectComponent(page, 'select--giftbox');
    this.noshiSelect = new CustomSelectComponent(page, 'select--wrapping');
  }

  /** Opens a product detail page directly by its jan code. */
  async gotoByCode(code: string, query?: Record<string, string>): Promise<void> {
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';

    await this.page.goto(`/${code}${queryString}`);
    await this.expectLoaded();
  }

  async expectQueryParamValue(name: string, value: string): Promise<void> {
    await expect.poll(() => new URL(this.page.url()).searchParams.get(name)).toBe(value);
  }

  /**
   * Clicks the page-body add-to-cart CTA and waits for the guest login redirect. When a
   * `discount_code` is present, add-to-cart runs a login check first (`utils/cart.js` →
   * `callApiCheckIsLogin`); a guest is redirected to the barista/login domain rather than adding.
   */
  async addToCartExpectingLoginRedirect(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(productDetailData.loginRedirectUrlPattern),
      this.addToCartButton.first().click(),
    ]);
  }

  /**
   * Opens the multi-variant selection overlay via the floating button. The floating button is
   * `position: fixed` and gets pointer-intercepted by the inline cart rows near the top of the page,
   * so scroll to the bottom first to free it, then click.
   */
  async openVariantOverlay(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.floatingVariantButton.click();
    await this.productSelection.expectOpen();
  }

  /**
   * Opens `/search` (optionally category-filtered), clicks the first product card, and waits until a
   * `/{code}` detail page has loaded. Returns the card's `href` so the caller can assert the landing.
   */
  async gotoFromSearch(cardIndex = 0, query?: Record<string, string>): Promise<string> {
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';

    await this.page.goto(`/search${queryString}`);
    await expect(this.searchProductList.cards.first()).toBeVisible();

    const href = await this.searchProductList.clickCard(cardIndex);

    await this.page.waitForURL(productDetailData.detailUrlPattern);
    await this.expectLoaded();

    return href;
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(productDetailData.detailUrlPattern);
    await expect(this.productName).toBeVisible();
  }

  async expectTaxNotice(): Promise<void> {
    await expect(this.taxNotice).toBeVisible();
    await expect(this.taxNotice).toContainText(productDetailData.text.taxIncluded);
  }

  async expectBreadcrumbTrail(): Promise<void> {
    await this.breadcrumbs.expectVisible();
    await this.breadcrumbs.expectHomeLink(productDetailData.text.breadcrumbHome);
    expect((await this.breadcrumbs.currentText()).length).toBeGreaterThan(0);
  }

  async productNameText(): Promise<string> {
    return (await this.productName.textContent())?.trim() ?? '';
  }
}
