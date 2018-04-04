# @grafoo/transport

A simple network layer to comunicate with graphql servers.

## Usage

@grafoo/transport default export is a factory that accepts `uri` and `fetchOptions` (can be an object or a function) as arguments:

```js
import createTransport from "@grafoo/transport";
import graphql from "@grafoo/loader";

const client = createClient("http://some-api.com/graphql", () => ({
  headers: {
    authorization: storage.getItem("authorization");
  }
}));

const { query } = grapqhl`
  query($id: ID!) {
    user(id: $id) {
      name
    }
  }
`;

client.request({ query, variables: { id: 123 } });
```

## Warning

As this package uses the fetch api under the hood, make sure to install a polyfill if you want to use it in your project.
