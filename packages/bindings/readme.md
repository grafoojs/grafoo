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
  <a href=https://github.com/grafoojs/grafoo>
    <img
      src=https://img.shields.io/npm/v/@grafoo/bindings.svg
      alt=npm
    >
  </a>
  <a href=https://github.com/grafoojs/grafoo>
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

This package was created to standardize how framework integrations are implemented for Grafoo. `@grafoo/bindings` has only a default export that is a `createBindings` factory function that returns an interface that provides data and notify for changes.

## API

### `createBindings` signature

```ts
import createBindings from "@grafoo/bindings";

const bindings = createBindings(client, props, updater);
```

### Arguments

| Argument | type           | Description                                           |
| -------- | -------------- | ----------------------------------------------------- |
| client   | ClientInstance | a client nstance                                      |
| props    | object         | a props object passed by the user (description below) |
| updater  | function       | a callback to notify for data changes                 |

### `props` argument

| Name      | type    | default | Descrition                                                 |
| --------- | ------- | ------- | ---------------------------------------------------------- |
| query     | object  | -       | the query created with `@grafoo/tag`'s template tag        |
| variables | object  | -       | GraphQL variables object for the query                     |
| mutations | object  | -       | an object where mutations are declared (description below) |
| skip      | boolean | -       | a flag to tell Grafoo not to go fetch the query right away |

### Mutations

Mutations is a mutations map having an arbitrary string name as key and the value as an object with some special properties. This object will generate a function with the same name given by the user that triggers the mutation. More on that later.

```ts
const mutations = {
  createPost: {
    query: CREATE_POST_MUTATION,
    optimisticUpdate: ({ allPosts }, variables) => ({
      allPosts: [{ ...variables.postInput, id: "tempID" }, ...allPosts]
    }),
    update: ({ allPosts }, response) => ({
      allPosts: allPosts.map(p => (p.id === "tempID" ? response.post : p))
    })
  }
};
```

Those properties stand for:

| Name             | type     | Descrition                                                              |
| ---------------- | -------- | ----------------------------------------------------------------------- |
| query            | object   | the mutation query created with `@grafoo/tag`                           |
| update           | function | will update the cache when a request is completed (description below)   |
| optimisticUpdate | function | will update the cache before a request is completed (description below) |

### `update` signature

The mutation `update` function is resposible to update the cache when a mutation request is completed. It's first argument is an object containing the data from the query passed to `createBindings` in the props argument. The second argument is the mutation response sent by the server. `update` return type is an object that describes the changes that have to be made to the cache.

```ts
type UpdateFn = (query: QueryData, response: MutationResponse) => CacheUpdate;
```

### `OptimisticUpdate` signature

`optimisticUpdate` is the function responsible to update the cache before a mutation request is completed. Like in `update`, `optimisticUpdate` first argument is the data from the query passed to `createBindings`. The second argument is the variables object.

```ts
type OptimistcUpdateFn = (query: QueryData, variables: Variables) => CacheUpdate;
```

### Bindings

The interface returned by `createBindings` has some fixed props.

| Name    | type     | default | Descrition                                       |
| ------- | -------- | ------- | ------------------------------------------------ |
| loading | boolean  | `true`  | whether the client is making a request or not    |
| loaded  | boolean  | `false` | whether the query data was already fetched       |
| errors  | string[] | -       | An array of GraphQL errors from a failed request |

The remaining bindings props are:

- the data fetched by the client and shaped according to the query property.
- mutations generated by the mutations map

### Bindings mutation

The mutation passed on bindings receives as the only argument the variables that it will use.

```ts
type MutationFn = (variables: Variables) => void;
```

## LICENSE

[MIT](https://github.com/grafoojs/grafoo/blob/master/LICENSE)
