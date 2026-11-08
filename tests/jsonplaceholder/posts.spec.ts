import { test, expect } from '../../fixtures/api.fixture';
import posts from '../../test-data/jsonplaceholder-posts.json';
import {
  asRecord,
  expectHeader,
  expectJsonContentType,
  expectSchema,
  expectStatus,
} from '../../src/validation/assertions';

test.describe('JSONPlaceholder posts', { tag: ['@jsonplaceholder'] }, () => {
  test(
    'reads a post and its response headers',
    { tag: ['@smoke', '@positive'] },
    async ({ jsonPlaceholder }) => {
      const response = await jsonPlaceholder.getPost(1);

      expectStatus(response, 200);
      expectJsonContentType(response);
      expectHeader(response, 'x-content-type-options', 'nosniff');
      expectHeader(response, 'x-powered-by', 'Express');
      expectSchema(response, 'jsonplaceholder/post.schema.json');

      const post = asRecord(response.body, 'post');
      expect(post.id).toBe(1);
      expect(post.userId).toBe(1);
      expect(post.title).toEqual(expect.any(String));
      expect(post.body).toEqual(expect.any(String));
    },
  );

  test('returns 404 for an unknown post', { tag: ['@negative'] }, async ({ jsonPlaceholder }) => {
    const response = await jsonPlaceholder.getPost(999_999);

    expectStatus(response, 404);
    expectJsonContentType(response);
    expect(response.body).toEqual({});
  });

  test('lists comments for a post', { tag: ['@positive'] }, async ({ jsonPlaceholder }) => {
    const response = await jsonPlaceholder.getComments(1);

    expectStatus(response, 200);
    expectJsonContentType(response);
    expectSchema(response, 'jsonplaceholder/comment-list.schema.json');
    const comments = response.body as Array<{ postId: number; email: string }>;
    expect(comments.length).toBeGreaterThan(0);
    expect(comments.every((comment) => comment.postId === 1)).toBe(true);
    expect(comments[0].email).toContain('@');
  });

  for (const seed of posts) {
    test(
      `reads post ${seed.id} for user ${seed.userId}`,
      { tag: ['@data-driven', '@positive'] },
      async ({ jsonPlaceholder }) => {
        const response = await jsonPlaceholder.getPost(seed.id);

        expectStatus(response, 200);
        expectSchema(response, 'jsonplaceholder/post.schema.json');
        const post = asRecord(response.body, 'post');
        expect(post.id).toBe(seed.id);
        expect(post.userId).toBe(seed.userId);
        expect(post.title).toBe(seed.title);
      },
    );
  }
});
