<h1 align=center>
  <img
    src=https://raw.githubusercontent.com/grafoojs/grafoo/master/logo.png
    alt=Grafoo
  />
</h1>

<p align=center><i>A GraphQL Client and Toolkit</i></p>

<p align=center>
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

Grafoo is a GraphQL client that tries to be different by adopting a **simpler API**, without giving up of a **good caching strategy**. It works in a **build time based approach**, compiling all of your queries based on the schema your app consumes. By doing so this library is fast, because it spares runtime computation and is really small because it does not ship with a GraphQL parser.

To sum up with all that we are working hard to bring **view layer ingrations** for all major frameworks. You can check the ones we already have at:

- [`@grafoo/react`](https://github.com/grafoojs/grafoo/tree/master/packages/react)
- [`@grafoo/preact`](https://github.com/grafoojs/grafoo/tree/master/packages/preact)

## Basic usage

### Installation

The basic packages you'll have to install in order to use Grafoo are core, tag and babel-plugin-tag.

```
$ npm i @grafoo/core @grafoo/tag && npm i -D @grafoo/babel-plugin-tag
```

### Configure babel

In `@grafoo/babel-plugin-tag` the option `schema` is a path to a GraphQL schema in your file system relative to the root of your project and `idFields` is an array of strings that represent the fields that Grafoo will automatically insert on your queries to build unique identifiers in order to normalize the cache. **Both options are required**.

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

### Writing your app

From `@grafoo/core` you will import the factory that creates the client instance and from `@grafoo/tag` you'll import the `graphql` or `gql` tag that will be compiled at build time.

```js
import createClient from "@grafoo/core";
import graphql from "@grafoo/tag";

const client = createClient("http://some.graphql.api", {
  headers: {
    /* can be a function as well */
  }
});

const USER_QUERY = graphql`
  query($id: ID!) {
    user(id: $id) {
      name
    }
  }
`;

const variables = { id: 123 };

client.request(USER_QUERY, variables).then(data => {
  client.write(USER_QUERY, variables, data);

  console.log(client.read(USER_QUERY, variables));
});
```

## LICENSE

[MIT](https://github.com/grafoojs/grafoo/blob/master/LICENSE)
