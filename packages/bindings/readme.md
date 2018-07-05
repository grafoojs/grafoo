# `@grafoo/bindings`

<p><i>Grafoo Bindings for Frameworks</i></p>

<p>
  <a href=https://circleci.com/gh/grafoojs/grafoo>
    <img
      src=https://img.shields.io/circleci/project/github/grafoojs/grafoo/master.svg?label=build
      alt=build
    />
  </a>
  <a href=https://codecov.io/github/grafoojs/grafoo>
    <img
      src=https://img.shields.io/codecov/c/github/grafoojs/grafoo/master.svg
      alt="coverage"
    />
  </a>
  <a href=https://www.npmjs.com/package/@grafoo/bindings>
    <img
      src=https://img.shields.io/npm/v/@grafoo/bindings.svg
      alt=npm
    >
  </a>
  <a href=https://www.npmjs.com/package/@grafoo/bindings>
    <img
      src=https://img.shields.io/npm/dm/@grafoo/bindings.svg
      alt=downloads
    >
  </a>
  <a href=https://prettier.io>
    <img
      src=https://img.shields.io/badge/code_style-prettier-ff69b4.svg
      alt="code style: prettier"
    />
  </a>
  <a href=https://lernajs.io>
    <img
      src=https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
      alt="mantained with: lerna"
    />
  </a>
</p>

This packages purpose is to standardize how view layer integrations are implemented for Grafoo. `@grafoo/bindings` has only a default export that is a `createBindings` factory function that returns an interface that provides data and notify for changes.

## API

### Arguments

| Argument | type         | Description                                           |
| -------- | ------------ | ----------------------------------------------------- |
| client   | GrafooClient | a client nstance                                      |
| props    | object       | a props object passed by the user (description below) |
| updater  | function     | a callback to notify for data changes                 |

#### Example

```js
import createBindings from "@grafoo/bindings";
import createClient from "@grafoo/core";

function fetchQuery(query, variables) {
  const init = {
    method: "POST",
    body: JSON.stringify({ query, variables }),
    headers: {
      "content-type": "application/json"
    }
  };

  return fetch("http://some.graphql.api", init).then(res => res.json());
}

const client = createClient(fetchQuery);
const props = {};
const updater = () => {};

const bindings = createBindings(client, props, updater);
```

### `props` argument

| Name      | type    | Descrition                                                 |
| --------- | ------- | ---------------------------------------------------------- |
| query     | object  | the query created with `@grafoo/core/tag`'s template tag   |
| variables | object  | GraphQL variables object for the query                     |
| mutations | object  | an object where mutations are declared (description below) |
| skip      | boolean | whether the client should skip the query request           |

### Mutations

The `mutations` prop is a map of _mutation objects_ that are shaped like so:

```js
const createPost = {
  query: CREATE_POST_MUTATION,
  optimisticUpdate: ({ allPosts }, variables) => ({
    allPosts: [{ ...variables.postInput, id: "tempID" }, ...allPosts]
  }),
  update: ({ allPosts }, response) => ({
    allPosts: allPosts.map(p => (p.id === "tempID" ? response.post : p))
  })
};

const mutations = { createPost };
```

A mutation object receives the following props:

| Name             | Type     | Required | Descrition                                                          |
| ---------------- | -------- | -------- | ------------------------------------------------------------------- |
| query            | object   | true     | a mutation query created with `@grafoo/core/tag`                    |
| update           | function | false    | updates the cache when a request is completed (description below)   |
| optimisticUpdate | function | false    | updates the cache before a request is completed (description below) |

Each mutation will generate a single function that accepts a GraphQL variables object as argument and return a promise that will resolve with the mutation data or reject with GraphQL `errors`.

```ts
type MutationFn = (variables: Variables) => Promise<MutationData>;
```

### Mutation query dependency

**Important** to notice that to update the cache `update` and `optimistUpdate` hooks depend on a `query` and it's `variables` object props (they need to be passed in the `props` object argument). If you need to perform a mutation but updating the cache is not strictly important you can just use the mutation promise resolved data or use the client instance directly.

### `update`

```ts
type UpdateFn = (query: QueryData, data: MutationData) => CacheUpdate;
```

The mutation `update` function is resposible to update the cache when the request is completed. It receives as paremeters an object containing the data from the query it depends upon and the mutation result. `update` return type is an object that describes the changes to be made to the cache.

### `optimisticUpdate`

```ts
type OptimistcUpdateFn = (query: QueryData, variables: Variables) => CacheUpdate;
```

In modern UIs it's to be expected that every user interaction occur in a fraction of seconds. `optimisticUpdate` responsability is to skip the mutation network roundtrip and update the cache instantaneously, making sure such interactions are as fast as they can be. `optimisticUpdate` as in `update` takes as first paremater the depedent query data. As second paremater it receives the variables object with which it's correpondent generated mutation function was called. And again it should return an object that describes the changes to be made to cache.

If you want to perform an optimitic update you have to make sure that the data you are inserting contains the field or fields to extract a unique identifier. For instance, say `@grafoo/babel-plugin` `idFields` option is set to insert a property `id`. Is to be expected that your update has that field mocked.

### Bindings

The object returned by `createBindings` contains the following props.

| Name    | type     | Descrition                                                   |
| ------- | -------- | ------------------------------------------------------------ |
| client  | object   | the client instance                                          |
| load    | function | a method to execute a query with the `query` prop            |
| loading | boolean  | whether the client is executing a query or not               |
| loaded  | boolean  | whether the query data is already cached                     |
| errors  | string[] | an array of GraphQL errors from a failed request to your API |

The remaining props are:

- the data fetched by the client and shaped according to your `query`
- mutation functions generated by the `mutations` object prop

## LICENSE

[MIT](https://github.com/grafoojs/grafoo/blob/master/LICENSE)
