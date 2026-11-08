import { test, expect } from '../../fixtures/api.fixture';
import products from '../../test-data/dummyjson-products.json';
import {
  asRecord,
  expectHeader,
  expectJsonContentType,
  expectSchema,
  expectStatus,
} from '../../src/validation/assertions';

test.describe('DummyJSON products', { tag: ['@dummyjson'] }, () => {
  test(
    'lists a page of products',
    { tag: ['@smoke', '@positive'] },
    async ({ dummyJsonAnonymous }) => {
      const limit = 5;
      const response = await dummyJsonAnonymous.listProducts(limit);

      expectStatus(response, 200);
      expectJsonContentType(response);
      expectHeader(response, 'x-content-type-options', 'nosniff');
      expectSchema(response, 'dummyjson/product-list.schema.json');

      const body = asRecord(response.body, 'product page');
      expect(body.limit).toBe(limit);
      expect(body.skip).toBe(0);
      expect(body.total).toEqual(expect.any(Number));
      expect(body.total as number).toBeGreaterThan(limit);
      const page = body.products as Array<{ price: number }>;
      expect(page).toHaveLength(limit);
      expect(page.every((product) => product.price >= 0)).toBe(true);
    },
  );

  test('reads a single product', { tag: ['@positive'] }, async ({ dummyJsonAnonymous }) => {
    const response = await dummyJsonAnonymous.getProduct(1);

    expectStatus(response, 200);
    expectJsonContentType(response);
    expectSchema(response, 'dummyjson/product.schema.json');
    const product = asRecord(response.body, 'product');
    expect(product.id).toBe(1);
    expect(product.category).toEqual(expect.any(String));
    expect(product.price).toEqual(expect.any(Number));
  });

  test(
    'returns 404 for an unknown product',
    { tag: ['@negative'] },
    async ({ dummyJsonAnonymous }) => {
      const response = await dummyJsonAnonymous.getProduct(999_999);

      expectStatus(response, 404);
      expectJsonContentType(response);
      expectSchema(response, 'dummyjson/error.schema.json');
      expect(String(asRecord(response.body, 'error').message)).toContain('999999');
    },
  );

  for (const seed of products) {
    test(
      `reads product ${seed.id} in ${seed.category}`,
      { tag: ['@data-driven', '@positive'] },
      async ({ dummyJsonAnonymous }) => {
        const response = await dummyJsonAnonymous.getProduct(seed.id);

        expectStatus(response, 200);
        expectSchema(response, 'dummyjson/product.schema.json');
        const product = asRecord(response.body, 'product');
        expect(product.id).toBe(seed.id);
        expect(product.category).toBe(seed.category);
        expect(product.title).toEqual(expect.any(String));
        expect(String(product.title).length).toBeGreaterThan(0);
      },
    );
  }
});
