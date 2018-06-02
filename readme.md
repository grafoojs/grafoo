# Grafoo

[![build](https://img.shields.io/circleci/project/github/malbernaz/grafoo/master.svg?label=circle)](https://circleci.com/gh/malbernaz/grafoo)

> Grafoo is an experimental graphql client under heavy development.

## Goals

- to have a minimal footprint on bundlesize
- to have a minimal runtime overhead
- to provide view layers for all major frameworks
- easebility of use

## Why

Mobile traffic. Grafoo is targeted to low-end devices.

## How

Grafoo parses all queries beforehand with the help of a babel plugin. At runtime the cache normalizes query results to then serve to the application.

## Installation

```shell
npm i @grafoo/core && npm i -D @grafoo/babel-plugin-tag
```

## Usage

### Babel

```json
{
  "plugins": [
    [
      "@grafoo/babel-plugin-tag",
      {
        "schema": "schema.graphql",
        "idFields": ["id"]
      }
    ]
  ]
}
```

### App

```js
import createClient from "@grafoo/core";
import graphql from "@grafoo/tag";

const client = createClient("http://some-graphql-api.com", {
  headers: {
    /* can be a function as well */
  }
});

const HELLO = graphql`
  query($id: ID!) {
    user(id: $id) {
      name
    }
  }
`;

const variables = { id: 123 };

client.request({ query: HELLO.query, variables }).then(data => {
  cache.write({ query: HELLO, variables }, data);

  console.log(client.read({ query: HELLO, variables }));
});
```

## Todo

- [x] Finish preact bindings
- [x] Preact bindings test suite
- [x] React bindings
- [ ] Svelte bindings
- [x] Enhance babel plugin
- [x] Continuous integration
- [ ] Publish

## LICENSE

[MIT](https://github.com/malbernaz/grafoo/blob/master/LICENSE)
