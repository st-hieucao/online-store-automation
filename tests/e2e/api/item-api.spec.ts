import { test, expect } from '@fixtures/test-base';
import { apiItemData } from '@test-data/api-item.data';
import { testTags } from '@utils/test-tags';
import { type ApiResult, stripVolatile } from '@api/item-api.client';

const { category, brandCode, skuCodes, pairingCategory, topLevelKeys, primaryFields } = apiItemData;

type Wrapped = Record<string, unknown>;
type Item = Record<string, unknown>;

/** Assert the body has exactly the expected top-level keys (order-independent) and 200 status. */
function expectWrapper(result: ApiResult<Wrapped>, expectedKeys: readonly string[]): void {
  expect(result.status).toBe(200);
  expect(Object.keys(result.body).sort()).toEqual([...expectedKeys].sort());
  expect(typeof result.body.count).toBe('number');
}

/** Pull the item/sku array out of a wrapped body and assert it is a non-empty array. */
function itemsOf(body: Wrapped, key: 'item' | 'sku'): Item[] {
  const items = body[key];
  expect(Array.isArray(items)).toBe(true);
  expect((items as Item[]).length).toBeGreaterThan(0);

  return items as Item[];
}

/** Assert one item carries the endpoint's primary data with the right types (data-agnostic). */
function expectPrimaryData(
  item: Item,
  fields: { code: string; name: string; price?: string; image: string },
): void {
  expect(typeof item[fields.code]).toBe('string');
  expect((item[fields.code] as string).length).toBeGreaterThan(0);

  expect(typeof item[fields.name]).toBe('string');
  expect((item[fields.name] as string).length).toBeGreaterThan(0);

  if (fields.price) {
    expect(typeof item[fields.price]).toBe('number');
  }

  expect(typeof item[fields.image]).toBe('string');
  expect((item[fields.image] as string).length).toBeGreaterThan(0);
}

/**
 * Call the same endpoint 3× and assert every body is byte-identical after stripping the only
 * volatile field (`current_timestamp`) — the sheet's "response stable after calling many times".
 */
async function expectStableAcrossCalls<T>(call: () => Promise<ApiResult<T>>): Promise<void> {
  const [first, second, third] = await Promise.all([call(), call(), call()]);

  expect(first.status).toBe(200);
  expect(second.status).toBe(200);
  expect(third.status).toBe(200);

  const baseline: unknown = stripVolatile(first.body);

  expect(stripVolatile(second.body) as unknown).toEqual(baseline);
  expect(stripVolatile(third.body) as unknown).toEqual(baseline);
}

test.describe(`API Interface | Item endpoints ${testTags.regression}`, () => {
  test.describe('Product List — /api/v1/list', () => {
    test(`ID-00138 single param returns a well-formed list ${testTags.smoke}`, async ({ itemApi }) => {
      const params = { category_code: category };
      let result: ApiResult<Wrapped>;

      await test.step('Returns 200 with the expected top-level shape', async () => {
        result = await itemApi.list<Wrapped>(params);
        expectWrapper(result, topLevelKeys.list);
      });

      await test.step('Each item carries the primary data (code / name / price / image)', async () => {
        const [item] = itemsOf(result.body, 'item');
        expectPrimaryData(item!, primaryFields.list);
      });

      await test.step('Repeated calls return an identical body', async () => {
        await expectStableAcrossCalls(() => itemApi.list<Wrapped>(params));
      });
    });

    test('ID-00139 multiple params returns a well-formed list', async ({ itemApi }) => {
      const params = { category_code: category, brand_code: brandCode };
      let result: ApiResult<Wrapped>;

      await test.step('Returns 200 with the expected top-level shape', async () => {
        result = await itemApi.list<Wrapped>(params);
        expectWrapper(result, topLevelKeys.list);
      });

      await test.step('Primary data present on the sampled item', async () => {
        const [item] = itemsOf(result.body, 'item');
        expectPrimaryData(item!, primaryFields.list);
      });

      await test.step('Repeated calls return an identical body', async () => {
        await expectStableAcrossCalls(() => itemApi.list<Wrapped>(params));
      });
    });
  });

  test.describe('Product List Preview — /api/v1/preview/list', () => {
    test(`ID-00140 multiple params returns a list with a validity window ${testTags.smoke}`, async ({
      itemApi,
    }) => {
      const params = { category_code: category, brand_code: brandCode };
      let result: ApiResult<Wrapped>;

      await test.step('Returns 200 with the expected top-level shape', async () => {
        result = await itemApi.previewList<Wrapped>(params);
        expectWrapper(result, topLevelKeys.previewList);
      });

      await test.step('Primary data + preview timestamps present on the sampled item', async () => {
        const [item] = itemsOf(result.body, 'item');
        expectPrimaryData(item!, primaryFields.list);
        for (const field of apiItemData.previewItemFields) {
          expect(item!).toHaveProperty(field);
        }
      });

      await test.step('Repeated calls return an identical body', async () => {
        await expectStableAcrossCalls(() => itemApi.previewList<Wrapped>(params));
      });
    });
  });

  test.describe('Product List (other) — /api/v1/list_other', () => {
    test(`ID-00141 single param returns a well-formed list ${testTags.smoke}`, async ({ itemApi }) => {
      const params = { category_code: category };
      let result: ApiResult<Wrapped>;

      await test.step('Returns 200 with the expected top-level shape', async () => {
        result = await itemApi.listOther<Wrapped>(params);
        expectWrapper(result, topLevelKeys.listOther);
      });

      await test.step('Primary data present on the sampled item', async () => {
        const [item] = itemsOf(result.body, 'item');
        expectPrimaryData(item!, primaryFields.listOther);
      });

      await test.step('Repeated calls return an identical body', async () => {
        await expectStableAcrossCalls(() => itemApi.listOther<Wrapped>(params));
      });
    });

    test('ID-00142 multiple params returns a well-formed list', async ({ itemApi }) => {
      const params = { category_code: category, inventory_quantity: true };
      let result: ApiResult<Wrapped>;

      await test.step('Returns 200 with the expected top-level shape', async () => {
        result = await itemApi.listOther<Wrapped>(params);
        expectWrapper(result, topLevelKeys.listOther);
      });

      await test.step('Primary data present on the sampled item', async () => {
        const [item] = itemsOf(result.body, 'item');
        expectPrimaryData(item!, primaryFields.listOther);
      });

      await test.step('Repeated calls return an identical body', async () => {
        await expectStableAcrossCalls(() => itemApi.listOther<Wrapped>(params));
      });
    });
  });

  test.describe('Product List (other) Preview — /api/v1/preview/list_other', () => {
    test('ID-00143 multiple params returns a list with a validity window', async ({ itemApi }) => {
      // `online_store` (not inventory_quantity) — preview data has no live inventory, so an
      // inventory filter empties the list; online_store is a valid preview param that returns rows.
      const params = { category_code: category, online_store: true };
      let result: ApiResult<Wrapped>;

      await test.step('Returns 200 with the expected top-level shape', async () => {
        result = await itemApi.previewListOther<Wrapped>(params);
        expectWrapper(result, topLevelKeys.previewListOther);
      });

      await test.step('Primary data + preview timestamps present on the sampled item', async () => {
        const [item] = itemsOf(result.body, 'item');
        expectPrimaryData(item!, primaryFields.listOther);
        for (const field of apiItemData.previewItemFields) {
          expect(item!).toHaveProperty(field);
        }
      });

      await test.step('Repeated calls return an identical body', async () => {
        await expectStableAcrossCalls(() => itemApi.previewListOther<Wrapped>(params));
      });
    });
  });

  test.describe('Request by Jancode — /api/v1/skus', () => {
    test(`ID-00144 single jancode returns its sku ${testTags.smoke}`, async ({ itemApi }) => {
      let result: ApiResult<Wrapped>;

      await test.step('Returns 200 with the expected top-level shape', async () => {
        result = await itemApi.skus<Wrapped>(skuCodes.single);
        expectWrapper(result, topLevelKeys.skus);
        expect(result.body.count).toBe(skuCodes.single.length);
      });

      await test.step('The sku row carries the primary data', async () => {
        const [sku] = itemsOf(result.body, 'sku');
        expectPrimaryData(sku!, primaryFields.skus);
      });

      await test.step('Repeated calls return an identical body', async () => {
        await expectStableAcrossCalls(() => itemApi.skus<Wrapped>(skuCodes.single));
      });
    });

    test('ID-00145 multiple jancodes return their skus', async ({ itemApi }) => {
      let result: ApiResult<Wrapped>;

      await test.step('Returns 200 with the expected top-level shape', async () => {
        result = await itemApi.skus<Wrapped>(skuCodes.multiple);
        expectWrapper(result, topLevelKeys.skus);
        expect(result.body.count).toBe(skuCodes.multiple.length);
      });

      await test.step('Primary data present on the sampled sku', async () => {
        const [sku] = itemsOf(result.body, 'sku');
        expectPrimaryData(sku!, primaryFields.skus);
      });

      await test.step('Repeated calls return an identical body', async () => {
        await expectStableAcrossCalls(() => itemApi.skus<Wrapped>(skuCodes.multiple));
      });
    });
  });

  test.describe('Pairing — /api/v1/pairing', () => {
    test(`ID-00146 category code returns a pairing list ${testTags.smoke}`, async ({ itemApi }) => {
      let result: ApiResult<Item[]>;

      await test.step('Returns 200 and a non-empty array (no wrapper object)', async () => {
        result = await itemApi.pairing<Item[]>(pairingCategory);
        expect(result.status).toBe(200);
        expect(Array.isArray(result.body)).toBe(true);
        expect(result.body.length).toBeGreaterThan(0);
      });

      await test.step('Each pairing item carries the primary data', async () => {
        const [item] = result.body;
        expectPrimaryData(item!, primaryFields.pairing);
      });

      await test.step('Repeated calls return an identical body', async () => {
        await expectStableAcrossCalls(() => itemApi.pairing<Item[]>(pairingCategory));
      });
    });
  });
});
