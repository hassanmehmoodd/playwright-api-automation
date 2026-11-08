import { test, expect } from '../../fixtures/api.fixture';
import {
  asRecord,
  expectJsonContentType,
  expectSchema,
  expectStatus,
} from '../../src/validation/assertions';

test.describe('product lifecycle', { tag: ['@dummyjson', '@chain', '@positive'] }, () => {
  test('chains a catalog read with simulated create, update, and delete', async ({
    dummyJsonAnonymous,
  }) => {
    const nonce = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const draft = {
      title: `Portfolio Lamp ${nonce}`,
      price: 42.5,
      category: 'beauty',
    };
    const replacedTitle = `Portfolio Lamp Updated ${nonce}`;
    const patchedPrice = 18.25;

    await test.step('read a catalog product', async () => {
      const response = await dummyJsonAnonymous.getProduct(1);
      expectStatus(response, 200);
      expectJsonContentType(response);
      expectSchema(response, 'dummyjson/product.schema.json');
      expect(asRecord(response.body, 'product').id).toBe(1);
    });

    await test.step('create a product', async () => {
      const response = await dummyJsonAnonymous.addProduct(draft);
      expectStatus(response, 201);
      expectJsonContentType(response);
      expectSchema(response, 'dummyjson/product-created.schema.json');
      const body = asRecord(response.body, 'created product');
      expect(body.title).toBe(draft.title);
      expect(body.price).toBe(draft.price);
      expect(body.category).toBe(draft.category);
      expect(body.id).toEqual(expect.any(Number));
    });

    await test.step('replace a product', async () => {
      const response = await dummyJsonAnonymous.replaceProduct(1, { title: replacedTitle });
      expectStatus(response, 200);
      expectJsonContentType(response);
      expectSchema(response, 'dummyjson/product-created.schema.json');
      expect(asRecord(response.body, 'replaced product').title).toBe(replacedTitle);
    });

    await test.step('patch a product price', async () => {
      const response = await dummyJsonAnonymous.patchProduct(1, { price: patchedPrice });
      expectStatus(response, 200);
      expectJsonContentType(response);
      const body = asRecord(response.body, 'patched product');
      expect(body.price).toBe(patchedPrice);
      expect(body.id).toBe(1);
    });

    await test.step('delete a product', async () => {
      const response = await dummyJsonAnonymous.deleteProduct(1);
      expectStatus(response, 200);
      expectJsonContentType(response);
      expectSchema(response, 'dummyjson/product-deleted.schema.json');
      const body = asRecord(response.body, 'deleted product');
      expect(body.id).toBe(1);
      expect(body.isDeleted).toBe(true);
      expect(body.deletedOn).toEqual(expect.any(String));
    });
  });
});
