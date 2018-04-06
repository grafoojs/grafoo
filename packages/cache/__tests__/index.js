import test from "ava";
import sinon from "sinon";

import executeQuery from "../__mocks__/execute-query";
import { PostsAndAuthors, Authors, Post, Posts } from "../__mocks__/queries";

import createCache from "../src";

let cache;
test.beforeEach(() => {
  cache = createCache();
});

test("should not throw", t => t.notThrows(createCache));

test("should be instantiable", t => {
  t.is(typeof cache.listen, "function");
  t.is(typeof cache.write, "function");
  t.is(typeof cache.read, "function");
  t.is(typeof cache.flush, "function");
});

test("should write queries to the cache", async t => {
  const { query } = PostsAndAuthors;
  const { data } = await executeQuery({ query });

  cache.write({ query: PostsAndAuthors }, data);

  const { objectsMap, pathsMap } = cache.flush();

  const { authors, posts } = data;

  t.deepEqual(
    authors,
    pathsMap["authors{__typename id name posts{__typename body id title}}"].data.authors
  );
  t.deepEqual(
    posts,
    pathsMap["posts{__typename author{__typename id name}body id title}"].data.posts
  );
  t.true(authors.every(author => Boolean(objectsMap[author.id])));
  t.true(posts.every(post => Boolean(objectsMap[post.id])));
});

test("should read queries from the cache", async t => {
  const { data } = await executeQuery({ query: Authors.query });
  const authorRequest = { query: Authors };

  cache.write(authorRequest, data);

  const { objects, data: fromCache } = cache.read(authorRequest);

  const { authors } = data;

  t.deepEqual(authors, fromCache.authors);
  t.true(authors.every(author => Boolean(objects[author.id])));
  t.true(authors.every(author => author.posts.every(post => Boolean(objects[post.id]))));
});

test("should handle queries with variables", async t => {
  const variables = { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
  const { data } = await executeQuery({ query: Post.query, variables });

  cache.write({ query: Post, variables }, data);

  t.is(cache.read({ query: Post, variables: { id: "123" } }), null);

  const dataFromCache = cache.read({ query: Post, variables });

  t.snapshot(dataFromCache);
});

test("should perform update to cache", async t => {
  const variables = { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
  const { data } = await executeQuery({ query: Post.query, variables });

  cache.write({ query: Post, variables }, data);

  const { data: { post } } = cache.read({ query: Post, variables });

  t.is(post.title, "Quam odit");

  cache.write(
    { query: Post, variables },
    { post: Object.assign({}, post, { title: "updated title" }) }
  );

  const { data: { post: postUpdated } } = cache.read({ query: Post, variables });

  t.is(postUpdated.title, "updated title");
});

test("should reflect updates on queries with shared objects", async t => {
  const variables = { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
  const { data: PostsData } = await executeQuery({ query: Posts.query });
  const { data: PostData } = await executeQuery({ query: Post.query, variables });
  const postsRequest = { query: Posts };

  cache.write(postsRequest, PostsData);

  const { data: { posts } } = cache.read(postsRequest);

  t.is(posts.find(p => p.id === variables.id).title, "Quam odit");

  cache.write(
    { query: Post, variables },
    { post: Object.assign(PostData.post, { title: "updated title" }) }
  );

  const { data: { posts: updatedPosts } } = cache.read(postsRequest);

  t.is(updatedPosts.find(p => p.id === variables.id).title, "updated title");
});

test("should merge objects in the cache when removing or adding properties", async t => {
  const variables = { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
  const { data } = await executeQuery({ query: Post.query, variables });
  const postRequest = { query: Post, variables };

  cache.write(postRequest, data);

  const { data: fromCache } = cache.read(postRequest);

  const post = JSON.parse(JSON.stringify(fromCache.post));

  delete post.__typename;

  post.foo = "bar";

  cache.write(postRequest, { post });

  const { data: { post: updatedPost } } = cache.read(postRequest, true);

  t.deepEqual(updatedPost, {
    __typename: "Post",
    author: {
      __typename: "Author",
      id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
      name: "Murphy Abshire"
    },
    body: "Ducimus harum delectus consectetur.",
    id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85",
    title: "Quam odit",
    foo: "bar"
  });
});

test("should call cache listeners on write with paths objects as arguments", async t => {
  const listener = sinon.spy();
  const variables = { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
  const { data } = await executeQuery({ query: Post.query, variables });
  const postRequest = { query: Post, variables };

  cache.listen(listener);

  cache.write(postRequest, data);

  const { objects } = cache.read(postRequest);

  const [lastCallArg] = listener.lastCall.args;

  t.deepEqual(objects, lastCallArg);
});

test.todo("should accept initialProps in options");

test.todo("should accept idFromProps function in options");
