# `@grafoo/bindings`

<p><i>The Grafoo Bindings for Frameworks</i></p>

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
      src=https://img.shields.io/badge/code_style-prettier-ff69b4.svg
      alt="code style: prettier"
    />
  </a>
</p>

This package was created to standardize how framework integrations are implemented for Grafoo. `@grafoo/bindings` has only a default export that is a `createBindings` factory function that returns an interface to provide the data and notify for changes.

## API

### `createBindings` signature

```ts
import createBindings from "@grafoo/bindings";

const bindings = createBindings(client, props, updater);
```

### Arguments

| Argument | Description                                           |
| -------- | ----------------------------------------------------- |
| client   | a client nstance                                      |
| props    | a props object passed by the user (description below) |
| updater  | a callback to notify for data changes                 |

### `props` argument

| Name      | type    | default | Descrition                                                 |
| --------- | ------- | ------- | ---------------------------------------------------------- |
| query     | object  | -       | the query created with `@grafoo/tag`'s template tag        |
| variables | object  | -       | GraphQL variables object for the query                     |
| mutations | object  | -       | an object where mutations are declared (description below) |
| skip      | boolean | -       | a flag to tell Grafoo not to go fetch the query right away |

### Mutations on `props` argument

Mutations is an object declared by the user having an arbitrary string name as key and the value as an object with some special properties.

```js
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

| Name             | type     | Descrition                                                                              |
| ---------------- | -------- | --------------------------------------------------------------------------------------- |
| query            | object   | the mutation query created with `@grafoo/tag`                                           |
| update           | function | a function that will update the cache when a request is completed (description below)   |
| optimisticUpdate | function | a function that will update the cache before a request is completed (description below) |
