# `@grafoo/babel-plugin-tag`

[![build](https://img.shields.io/circleci/project/github/malbernaz/grafoo/master.svg?label=build)](https://circleci.com/gh/malbernaz/grafoo)

The Grafoo babel plugin.

## Install

```js
$ npm i @grafoo/core @grafoo/tag && npm i -D @grafoo/babel-plugin-tag
```

## Configuration

To configure the plugin is required to specify a `schema`, which is a path to a GraphQL schema in your file system relative to the root of your project, and `idFields`, an array of strings that represent the fields that Grafoo will use to build object identifiers:

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

## How to get my schema?

The recommendation is to use the [`get-graphql-schema`](https://github.com/prismagraphql/get-graphql-schema), by [Prisma](https://www.prisma.io/). In the near future we are planning to introduce a `schemaUrl` option to this plugin so this step wont be required anymore.

## Transformations

`@grafoo/babel-plugin-tag` transforms your code in three ways:

- Template tag literals using the default export from `@grafoo/tag` will be compiled to a special object that will assist the client on the caching process.
- `@grafoo/tag` import statements will be removed.
- `idFields` will be inserted automatically on client instantiation.

### Input

```js
import createClient from "@grafoo/core";
import graphql from "@grafoo/tag";

const client = createClient("http://some.graphql.api/");

const USER_QUERY = graphql`
  query($id: ID!) {
    user(id: $id) {
      name
      posts {
        title
      }
    }
  }
`;
```

### Output

```js
import createClient from "@grafoo/core";

const client = createClient("http://some.graphql.api/", {
  idFields: ["id"]
});

const USER_QUERY = {
  query: "query($id: ID!) { user(id: $id) { id name posts { id title } } }",
  paths: {
    "user(id:$id){id name posts{id title}}": {
      name: "user"
      args: ["id"]
    }
  }
};
```

## LICENSE

[MIT](https://github.com/malbernaz/grafoo/blob/master/LICENSE)
