# `@grafoo/babel-plugin`

<p><i>Grafoo Babel Plugin</i></p>

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
  <a href=https://www.npmjs.com/package/@grafoo/babel-plugin>
    <img
      src=https://img.shields.io/npm/v/@grafoo/babel-plugin.svg
      alt=npm
    >
  </a>
  <a href=https://www.npmjs.com/package/@grafoo/babel-plugin>
    <img
      src=https://img.shields.io/npm/dm/@grafoo/babel-plugin.svg
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
  <a href=https://grafoo-slack.herokuapp.com>
    <img
      src=https://grafoo-slack.herokuapp.com/badge.svg
      alt="slack"
    />
  </a>
</p>

A premise Grafoo takes is that it should be able to extract an unique identifier from every node on the queries you write. It can be a GraphQL `ID` field, or more fields that together can form one (eg: an incremental integer and the GraphQL meta field `__typename`). It is `@grafoo/babel-plugin`'s responsibility to insert those fields on your queries automatically. If you have already used Apollo this should be very familiar to you, as our `idFields` configuration has the same pourpose of Apollo Cache's `dataIdFromObject`: to normalize your data.

## Install

```
$ npm i @grafoo/core && npm i -D @grafoo/babel-plugin
```

## Configuration

To configure the plugin is required to specify the option `idFields`, an array of strings that represent the fields that Grafoo will use to build object identifiers. The option `schema`, is a path to a GraphQL schema in your file system relative to the root of your project, if not specified the plugin will look for the schema in the root of your project:

```json
{
  "plugins": [
    [
      "@grafoo/babel-plugin",
      {
        "schema": "schema.graphql",
        "idFields": ["id"],
        "generateIds": false
      }
    ]
  ]
}
```

## How to get my schema?

The recommendation for now is to use the [`get-graphql-schema`](https://github.com/prismagraphql/get-graphql-schema), by [Prisma](https://www.prisma.io/). In the near future we are planning to introduce a `schemaUrl` option to this plugin so that this step won't be required anymore.

## Transformations

`@grafoo/babel-plugin` transforms your code in three ways:

- Template tag literals using the default export from submodule `@grafoo/core/tag` will be compiled to a special object that will assist the client on the caching process.
- Imports from submodule `@grafoo/core/tag` statements will be removed.
- `idFields` will be inserted automatically on client instantiation.

```diff
  import createClient from "@grafoo/core";
- import graphql from "@grafoo/core/tag";

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

- const client = createClient(fetchQuery);
+ const client = createClient(fetchQuery, {
+   idFields: ["id"]
+ });

- const USER_QUERY = graphql`
-   query($id: ID!) {
-     user(id: $id) {
-       name
-       posts {
-         title
-       }
-     }
-   }
- `;
+ const USER_QUERY = {
+   id: "d4b567cd2a8891aa4cd1840f1a53002e", // only if option "generateIds" is true
+   query: "query($id: ID!) { user(id: $id) { id name posts { id title } } }",
+   paths: {
+     "user(id:$id){id name posts{id title}}": {
+       name: "user"
+       args: ["id"]
+     }
+   }
+ };
```

## LICENSE

[MIT](https://github.com/grafoojs/grafoo/blob/master/LICENSE)
