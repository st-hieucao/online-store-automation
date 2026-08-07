import type { APIRequestContext, APIResponse } from '@playwright/test';

import { apiItemData } from '@test-data/api-item.data';

/**
 * Query params accepted by the list-family endpoints. Kept loose (string/number/boolean) — the API
 * validates values server-side; these tests only send known-valid combinations.
 */
export type ListParams = Record<string, string | number | boolean>;

/** A parsed API call result: HTTP status + JSON body (object for wrapped endpoints, array for pairing). */
export interface ApiResult<T = unknown> {
  status: number;
  body: T;
}

/**
 * CloudFront in front of `dev.menu.starbucks.co.jp` blocks requests without a browser-like
 * User-Agent (returns 403). Playwright's APIRequestContext sends a non-browser UA by default, so we
 * set these explicitly on every call.
 */
const WAF_HEADERS = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

/**
 * Thin wrapper over `APIRequestContext` for the public Item API (`/api/v1/*`). One method per
 * endpoint returns `{ status, body }`; specs assert on the result rather than building URLs/queries
 * themselves. `baseURL` is inherited from the Playwright config, so paths are relative.
 */
export class ItemApiClient {
  private readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  private async get<T>(path: string, params?: ListParams): Promise<ApiResult<T>> {
    const response = await this.request.get(`${apiItemData.basePath}${path}`, {
      params,
      headers: WAF_HEADERS,
    });

    return { status: response.status(), body: (await response.json()) as T };
  }

  /** GET /api/v1/list — needs a valid `category_code`; returns { count, current_timestamp, item[], aggs }. */
  list<T = Record<string, unknown>>(params: ListParams): Promise<ApiResult<T>> {
    return this.get<T>('/list', params);
  }

  /** GET /api/v1/preview/list — like `list`, each item also carries start/end_timestamp. */
  previewList<T = Record<string, unknown>>(params: ListParams): Promise<ApiResult<T>> {
    return this.get<T>('/preview/list', params);
  }

  /** GET /api/v1/list_other — { count, current_timestamp, item[] } (no aggs). */
  listOther<T = Record<string, unknown>>(params: ListParams): Promise<ApiResult<T>> {
    return this.get<T>('/list_other', params);
  }

  /** GET /api/v1/preview/list_other — like `list_other`, with start/end_timestamp per item. */
  previewListOther<T = Record<string, unknown>>(params: ListParams): Promise<ApiResult<T>> {
    return this.get<T>('/preview/list_other', params);
  }

  /** GET /api/v1/skus — `sku_code[]` array; returns { count, current_timestamp, sku[] }. */
  skus<T = Record<string, unknown>>(skuCodes: readonly string[]): Promise<ApiResult<T>> {
    const query = skuCodes.map((code) => `sku_code[]=${encodeURIComponent(code)}`).join('&');

    return this.get<T>(`/skus?${query}`);
  }

  /** GET /api/v1/pairing — returns a bare array of pairing items. */
  pairing<T = unknown[]>(category: string): Promise<ApiResult<T>> {
    return this.get<T>('/pairing', { category });
  }

  /** Fetch the raw APIResponse for a path — used when a test needs headers/content-type, not JSON. */
  raw(path: string, params?: ListParams): Promise<APIResponse> {
    return this.request.get(`${apiItemData.basePath}${path}`, { params, headers: WAF_HEADERS });
  }
}

/** Recursively omit `current_timestamp` so repeated-call bodies can be compared for exact equality. */
export function stripVolatile<T>(body: T): T {
  if (Array.isArray(body)) {
    return body.map((entry) => stripVolatile(entry)) as unknown as T;
  }

  if (body !== null && typeof body === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (key === apiItemData.volatileKey) {
        continue;
      }
      result[key] = stripVolatile(value);
    }

    return result as T;
  }

  return body;
}
