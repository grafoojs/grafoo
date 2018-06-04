# `@grafoo/transport`

<p>
  <a href=https://circleci.com/gh/grafoojs/grafoo>
    <img
      src=https://img.shields.io/circleci/project/github/grafoojs/grafoo/master.svg?label=build
      alt=build
    />
  </a>
  <a href=https://github.com/grafoojs/grafoo>
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

A simple http client to comunicate with graphql servers.

## Install

```
$ npm i @grafoo/transport
```

## Usage

`@grafoo/transport` default export is a factory that accepts as arguments `uri` and `headers` (that can be an object or a function):

```js
import createTransport from "@grafoo/transport";

const request = createTransport("http://some.graphql.api", () => ({
  authorization: storage.getItem("authorization")
}));

const USER_QUERY = `
  query($id: ID!) {
    user(id: $id) {
      name
    }
  }
`;

const variables = { id: 123 };

request(USER_QUERY, variables).then(({ user }) => {
  console.log(user);
});
```

## Warning

As this package uses `fetch` and `Object.assign` under the hood, so make sure to install the proper polyfills if you want to use it in your project.

## LICENSE

[MIT](https://github.com/grafoojs/grafoo/blob/master/LICENSE)
