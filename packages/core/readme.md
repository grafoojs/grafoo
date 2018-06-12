# `@grafoo/core`

<p><i>Grafoo core</i></p>

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
      src=https://img.shields.io/npm/v/@grafoo/core.svg
      alt=npm
    >
  </a>
  <a href=https://github.com/grafoojs/grafoo>
    <img
      src=https://img.shields.io/npm/dm/@grafoo/core.svg
      alt=downloads
    >
  </a>
  <a href=https://github.com/grafoojs/grafoo>
    <img
      src=https://img.shields.io/bundlephobia/minzip/@grafoo/core.svg?label=size
      alt=size
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

## Install

<!-- ```
$ npm i @grafoo/core && npm i -D @grafoo/babel-plugin
``` -->

## Setup

Assuming you already have babel installed, the only additional step required to build an application with Grafoo is to configure [`@grafoo/babel-plugin`](https://github.com/grafoojs/grafoo/tree/master/packages/babel-plugin). The options it accepts are `idFields` - the fields Grafoo will take to build unique identifiers, and `schema`, which is a relative path to your schema file.

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

## API

`@grafoo/core` consists of a module that exports as default function a factory to create the client intance and a submodule that exports that `graphql` template tag.

### `graphql` template tag

From `@grafoo/core/tag` is exported the `graphql` or `gql` tag that you'll use to create your queries. On build time every time you use that tag it will be replace with a special object that assists the client on the caching process. It is a dummy module and if you do not have `@grafoo/babel-plugin` it will thow you an error.

#### Example

```js
import gql from "@grafoo/core/tag";

const USER_QUERY = gql`
  query($id: ID!) {
    user(id: $id) {
      name
    }
  }
`;

// will be transformed to this on build time

const USER_QUERY = {
  query: "query($id: ID!) { user(id: $id) { name id } }"
  paths: {
    "user(id:$id){name id}": {
      name: "user",
      args: ["id"]
    }
  }
}
```

### `createClient` factory

`createClient` accepts as arguments `uri` which is the http address to your GraphQL API and an options object. This options are:

| Option       | Type               | Required | Description                                                                           |
| ------------ | ------------------ | -------- | ------------------------------------------------------------------------------------- |
| headers      | object \| function | true     | the headers to be sent in every request the client performs                           |
| idFields     | string[]           | false    | fields Grafoo takes to build unique identifiers                                       |
| initialState | object             | false    | a initial state to hydrate the cache. It can be produced by the `flush` client method |

### Headers

Set this option to specify what are the headers your server expects from your requests. It can be an object if you already know beforehand which headers to send or a function if you need to update your headers in every request.

#### Example

```js
import createClient from "@grafoo/core";

const clientWithStaticHeaders = createClient("http://some.graphql.api", {
  headers: {
    authorization: "Bearer some.token"
  }
});

// or

const clientWithDynamicHeaders = createClient("http://some.graphql.api", {
  headers: () => ({
    authorization: storage.get("token")
  })
});
```

### IdFields

`IdFields` is homologous to the `@grafoo/babel-plugin` option with the same name. You don't have much to worry about it because it's **automatically inserted by `@grafoo/babel-plugin`** on every client instatiation. It is an array of fields that Grafoo will take to build unique identifiers.

Say you want to consume a query like so:

```graphql
{
  me {
    name
  }
}
```

If `idFields` is configured with `["id"]`. This query will be transformed to this:

```graphql
{
  me {
    name
    id
  }
}
```

Then the client, when caching this data, will use this `id` field to store it.

#### Example

```js
const client = createClient("http://some.graphql.api", {
  idFields: ["id", "__typename"]
});
```

## `ClientInstance`

the `createClient` factory returns a client instance with some methods:

| Name    | Description                                            |
| ------- | ------------------------------------------------------ |
| request | makes query requests                                   |
| read    | reads queries from the cache                           |
| write   | writes queries to the cache                            |
| listen  | takes a listener callback and notify for cache changes |
| flush   | dumps the internal state of the instance cache         |

### `ClientInstance.request`

This method receives as arguments a query object created with the `@grafoo/core/tag` template tag and optionally a GraphQL variables object. It returns a promise that will resolve with the data requested or reject with an list of GraphQL errors.

#### Example

```js
const variables = { id: 123 };

client.request(USER_QUERY, variables).then(data => {
  console.log(data); // { "user": { "name": "John Doe", "id": "123" } }
});
```

### `ClientInstance.write`

The write method as the name implies writes to the cache. It takes as argumets the query object, an optional variables object and the data to be stored.

#### Example

```js
client.request(USER_QUERY, variables).then(data => {
  client.write(USER_QUERY, variables, data);
});
```

### `ClientInstance.read`

The read method takes as arguments the query object and optionally a variables object. It returns an object with two properties: `data` which is an tree structured object shaped according to your query tree and `objects`, a flat structured object containing every node on your query indexed by a unique id created with the `idProps` option passed on client instatiation.

#### Example

```js
client.read(USER_QUERY, variables);
// {
//   "data": {
//     "user": {
//       "name": "John Doe",
//       "id": "123"
//     }
//   },
//   "objects": {
//     "123": {
//       "name": "John Doe",
//       "id": "123"
//     }
//   }
// }
```

### `ClientInstance.listen`

`listen` takes a _listener_ callback as argument. Whenever the cache is updated that _listener_ is called with the objects that were inserted, modified or removed.

#### Example

```js
function listener(object) {
  console.log(objects);
}

const unlisten = client.listen();

client.write(USER_QUERY, variables, data);

unlisten(); // detaches the listener from the client
```

### `ClientInstance.flush`

The `flush` method dumps all of the data inside the cache in it's raw state, producing a snapshot. It is to be used in mainly on the server producing, a initial state that can be passed as an option to `createClient` on client side.

#### Example

```js
// server.js
app.get("/", (req, res) => {
  res.send(`<script>_GRAFOO_INITIAL_STATE_=${JSON.stringify(client.flush())}_</script>`);
});

// client

const client = createClient("http://some.graphql.api/", {
  initialState: window._GRAFOO_INITIAL_STATE_
});
```

## LICENSE

[MIT](https://github.com/grafoojs/grafoo/blob/master/LICENSE)
