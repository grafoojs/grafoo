<h1 align=center>
  <img
    src=https://raw.githubusercontent.com/malbernaz/grafoo/master/logo.png
    alt=Grafoo
  />
</h1>

<p align=center>A GraphQL Client and Toolkit</p>

<p align=center>
  <a href=https://circleci.com/gh/malbernaz/grafoo>
    <img
      src=https://img.shields.io/circleci/project/github/malbernaz/grafoo/master.svg?label=build
      alt=build
    />
  </a>
  <a href=https://github.com/malbernaz/grafoo>
    <img
      src=https://img.shields.io/badge/code_style-prettier-ff69b4.svg
      alt="code style: prettier"
    />
  </a>
</p>

In GraphQL we don't have as many libraries targeted to the client as do on the server side. **Grafoo** is a GraphQL client and toolkit that tries to be different by introducing a **build time dependent approach**, where all your queries are compiled beforehand in order to spare runtime computation. To sum up with that we are working hard to bring **view layer ingrations** for all major frameworks. You can check the ones we already have at:

- [`@grafoo/react`](https://github.com/malbernaz/grafoo/tree/master/packages/react)
- [`@grafoo/preact`](https://github.com/malbernaz/grafoo/tree/master/packages/preact)

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

[MIT](https://github.com/malbernaz/grafoo/blob/master/LICENSE)
