# `@grafoo/babel-plugin`

<p><i>The Grafoo Babel Plugin.</i></p>

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

A premise that Grafoo takes is that it should be able to extract an unique identifier from every node on the queries you write. It can be a GraphQL `ID` field, or more fields that together can form one (eg: an incremental integer and the GraphQL meta field `__typename`). It is `@grafoo/babel-plugin`'s responsibility to insert those fields on your queries automatically. If you have already used Apollo this should be very familiar to you, as our `idFields` configuration has the same pourpose of Apollo Cache's `dataIdFromObject`: to normalize your data.

## Install

```
$ npm i @grafoo/core @grafoo/tag && npm i -D @grafoo/babel-plugin
```

## Configuration

To configure the plugin is required to specify a `schema`, which is a path to a GraphQL schema in your file system relative to the root of your project, and `idFields`, an array of strings that represent the fields that Grafoo will use to build object identifiers:

```json
{
  "plugins": [
    [
      "@grafoo/babel-plugin",
      {
        "schema": "schema.graphql",
        "idFields": ["id"]
      }
    ]
  ]
}
```

_At the moment if you are using babel 7, you'll have to declare the plugin as `module:@grafoo/babel-plugin`, because of the naming rules babel has._

## How to get my schema?

The recommendation is to use the [`get-graphql-schema`](https://github.com/prismagraphql/get-graphql-schema), by [Prisma](https://www.prisma.io/). In the near future we are planning to introduce a `schemaUrl` option to this plugin so that this step wont be required anymore.

## Transformations

`@grafoo/babel-plugin` transforms your code in three ways:

- Template tag literals using the default export from `@grafoo/tag` will be compiled to a special object that will assist the client on the caching process.
- `@grafoo/tag` import statements will be removed.
- `idFields` will be inserted automatically on client instantiation.

```diff
  import createClient from "@grafoo/core";
- import graphql from "@grafoo/tag";

- const client = createClient("http://some.graphql.api/");
+ const client = createClient("http://some.graphql.api/", {
+   idFields: ["id"]
+ });

-  const USER_QUERY = graphql`
-    query($id: ID!) {
-      user(id: $id) {
-        name
-        posts {
-          title
-        }
-      }
-    }
-  `;
+ const USER_QUERY = {
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
