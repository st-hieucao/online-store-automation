/**
 * Static inputs + expected response shapes for the public Item API endpoints
 * (`online-store-web` `routes/api.php` v1 group → `Api\ItemController`). All values verified live
 * against `dev.menu.starbucks.co.jp` (2026-08-06):
 *
 * - `list` / `list_other` / `preview/*` require a valid, non-expired `category_code` (the controller
 *   calls `PzCategoryService::validateCategory()` and returns 404 otherwise) — `beans` is valid.
 * - `skus` takes JAN/SKU codes as a `sku_code[]` array; the item_code of a catalog product doubles
 *   as its sku_code. `pairing` takes a `category` string.
 * - Responses are hand-built arrays (no Laravel `data`/`meta` wrapper). `current_timestamp` is
 *   regenerated per call, so it is the only volatile field — every other field is deterministic
 *   (verified: 3 identical calls are byte-equal after stripping it).
 */
export const apiItemData = {
  basePath: '/api/v1',

  // Valid, non-expired category (reused from search.data.ts categories) + a valid brand filter.
  category: 'beans',
  brandCode: 'starbucks-coffee',

  // Real catalog item_codes usable as sku_code[] (each returns exactly one sku row).
  skuCodes: {
    single: ['4524785366367'],
    multiple: ['4524785366367', '4524785492486', '4524785528765'],
  },

  // Category that returns a non-empty food-pairing list.
  pairingCategory: 'beans',

  // Only field that changes between otherwise-identical calls — stripped before the deep-equal
  // stability assertion.
  volatileKey: 'current_timestamp',

  // Expected top-level keys per endpoint (exact set, order-independent).
  topLevelKeys: {
    list: ['count', 'current_timestamp', 'item', 'aggs'],
    previewList: ['count', 'current_timestamp', 'item', 'aggs'],
    listOther: ['count', 'current_timestamp', 'item'],
    previewListOther: ['count', 'current_timestamp', 'item'],
    skus: ['count', 'current_timestamp', 'sku'],
    // `pairing` returns a bare array — no wrapper object.
  },

  // Primary-data fields asserted per item. `name`/`price`/`image` in the sheet map to these real
  // keys; there is no `jan_code` (the identifier is `item_code` / `sku_code`).
  primaryFields: {
    // /list and /preview/list share the `image_url` naming.
    list: {
      code: 'item_code',
      name: 'item_name',
      price: 'price_in_vat',
      image: 'image_url',
    },
    // /list_other, /preview/list_other, /skus use `image_url_grid`.
    listOther: {
      code: 'item_code',
      name: 'item_name',
      price: 'price_in_vat',
      image: 'image_url_grid',
    },
    skus: {
      code: 'sku_code',
      name: 'item_name',
      price: 'price_in_vat',
      image: 'image_url_grid',
    },
    pairing: {
      code: 'item_code',
      name: 'item_name',
      image: 'image_url_grid',
    },
  },

  // Preview-only per-item fields (validity window), present on both preview endpoints.
  previewItemFields: ['start_timestamp', 'end_timestamp'],
} as const;
