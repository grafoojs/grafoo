# `@grafoo/babel-plugin-tag`

> A babel plugin to be used to compile graphql tags to used with the Grafoo client and it is meant to be used with the `@grafoo/tag` package.

## Install

```js
$ npm i @grafoo/tag && npm i -D @grafoo/babel-plugin-tag
```

## Usage

### Babel

First you have to configure the plugin specifing a schema (required) and the fields to be inserted in the queries:

```json
{
  "plugins": [
    [
      "@grafoo/babel-plugin-tag",
      {
        "schema": "schema.graphql",
        "fieldsToInsert": ["id"]
      }
    ]
  ]
}
```

### App

In your app you'll have to import the graphql template tag from `@grafoo/tag`:

#### Input:

```js
import graphql from "@grafoo/tag";

const query = graphql`
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

#### Output:

```js
const query = {
  query: "query($id: ID!) { user(id: $id) { name posts { title } } }",
  paths: {
    "user(id:$id){nameposts{title}}": {
      name: "user"
      args: ["id"]
    }
  }
};
```

## LICENSE

[MIT](https://github.com/malbernaz/grafoo/blob/master/LICENSE)
