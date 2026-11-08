import { test, expect } from '../../fixtures/api.fixture';
import {
  asRecord,
  expectHeader,
  expectJsonContentType,
  expectSchema,
  expectStatus,
} from '../../src/validation/assertions';

test.describe('post lifecycle', { tag: ['@jsonplaceholder', '@chain', '@positive'] }, () => {
  test('validates create, read, update, patch, and delete contracts', async ({
    jsonPlaceholder,
  }) => {
    const nonce = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const created = {
      title: `Portfolio post ${nonce}`,
      body: 'Created by the API automation suite.',
      userId: 7,
    };
    const replaced = {
      id: 1,
      title: `Portfolio post replaced ${nonce}`,
      body: 'Replaced by the API automation suite.',
      userId: 7,
    };
    const patchedTitle = `Portfolio post patched ${nonce}`;

    await test.step('create a post', async () => {
      const response = await jsonPlaceholder.createPost(created);
      expectStatus(response, 201);
      expectJsonContentType(response);
      expectHeader(response, 'location', /\/posts\/\d+/);
      expectSchema(response, 'jsonplaceholder/post.schema.json');
      const body = asRecord(response.body, 'created post');
      expect(body.title).toBe(created.title);
      expect(body.body).toBe(created.body);
      expect(body.userId).toBe(created.userId);
      expect(body.id).toEqual(expect.any(Number));
    });

    await test.step('read a stored post', async () => {
      const response = await jsonPlaceholder.getPost(1);
      expectStatus(response, 200);
      expectSchema(response, 'jsonplaceholder/post.schema.json');
      expect(asRecord(response.body, 'post').id).toBe(1);
    });

    await test.step('replace a post', async () => {
      const response = await jsonPlaceholder.updatePost(1, replaced);
      expectStatus(response, 200);
      expectJsonContentType(response);
      expectSchema(response, 'jsonplaceholder/post.schema.json');
      const body = asRecord(response.body, 'replaced post');
      expect(body.id).toBe(1);
      expect(body.title).toBe(replaced.title);
      expect(body.body).toBe(replaced.body);
      expect(body.userId).toBe(replaced.userId);
    });

    await test.step('patch a post title', async () => {
      const response = await jsonPlaceholder.patchPost(1, { title: patchedTitle });
      expectStatus(response, 200);
      expectSchema(response, 'jsonplaceholder/post.schema.json');
      const body = asRecord(response.body, 'patched post');
      expect(body.id).toBe(1);
      expect(body.title).toBe(patchedTitle);
      expect(body.body).toEqual(expect.any(String));
    });

    await test.step('delete a post', async () => {
      const response = await jsonPlaceholder.deletePost(1);
      expectStatus(response, 200);
      expectJsonContentType(response);
      expect(response.body).toEqual({});
    });
  });
});
