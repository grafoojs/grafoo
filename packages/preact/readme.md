# `@grafoo/preact`

<p><i>Grafoo Preact Bindings</i></p>

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
      src=https://img.shields.io/npm/v/@grafoo/preact.svg
      alt=npm
    >
  </a>
  <a href=https://github.com/grafoojs/grafoo>
    <img
      src=https://img.shields.io/npm/dm/@grafoo/preact.svg
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
</p>

## Install

```
$ npm i @grafoo/{core,react} && npm i -D @grafoo/babel-plugin
```

## API

For documentation please refer to [`@grafoo/react`](https://github.com/grafoojs/grafoo/tree/master/packages/react)'s page since both modules share the same API.

## Example

### `index.js`

```jsx
import { h, render } from "preact";
import { Provider } from "@grafoo/preact";

import client from "./client";
import Posts from "./Posts";

render(
  <Provider client={client}>
    <Posts />
  </Provider>,
  document.getElementById("mnt")
);
```

### `Posts.js`

```jsx
import { h } from "preact";
import gql from "@grafoo/core/tag";
import { Consumer } from "@grafoo/preact";

const ALL_POSTS = gql`
  query getPosts($orderBy: PostOrderBy) {
    allPosts(orderBy: $orderBy) {
      title
      content
      createdAt
      updatedAt
    }
  }
`;

export default function Posts() {
  return (
    <Consumer query={query} variables={{ orderBy: "createdAt_DESC" }}>
      {({ loading, loaded, errors, allPosts }) => (
        <h1>
          <marquee>👆 do whatever you want with the variables above 👆</marquee>
        </h1>
      )}
    </Consumer>
  );
}
```
