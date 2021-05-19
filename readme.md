<h1 align=center style="margin: 80px 0">
  <picture>
    <source srcset="https://raw.githubusercontent.com/grafoojs/grafoo/master/logo-light.svg" media="(prefers-color-scheme: light) or (prefers-color-scheme: no-preference)" />
    <source srcset="https://raw.githubusercontent.com/grafoojs/grafoo/master/logo-dark.svg" media="(prefers-color-scheme: dark)" />
    <img src="https://raw.githubusercontent.com/grafoojs/grafoo/master/logo-light.svg" alt=Grafoo />
  </picture>
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
      src=https://img.shields.io/npm/v/@grafoo/babel-plugin.svg
      alt=npm
    >
  </a>
  <a href=https://github.com/grafoojs/grafoo>
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

Grafoo is a GraphQL client that tries to be different by adopting a **simpler API**, without giving up of a **good caching strategy**.

## Some useful information

- **It's a multiple paradigm library**. So far we have **view layer integrations** for [react](https://github.com/grafoojs/grafoo/tree/master/packages/react) and [preact](https://github.com/grafoojs/grafoo/tree/master/packages/preact) and there are more to come.
- **It's not just a HTTP client**. It comes with a sophisticated caching system under the hood to make sure your data is consistent across your app.
- **It's build time dependent**. A important piece of Grafoo is it's **babel** plugin that compiles your queries based on the schema your app consumes.
- **It's environment agnostic**. Apart from the browser you can run Grafoo on the **server** and even on **native** with react.

## Why should I use this

Many of the work that has been put into this project came from borrowed ideas and concepts that are present in the GraphQL clients we have today. Grafoo wants to stand apart from the others trying to be in that sweet spot between **simplicity** and **usability**. Moreover, most of the benefits this library brings to the table are related to the fact that it does a lot at build time. It's **fast**, because it spares runtime computation and it's really **small** (something like **~1.6kb** for core and react) because it does not ship with a GraphQL parser.

## Example applications

You can refer to examples in [this repository](https://github.com/grafoojs/grafoo-examples).

## Basic usage

### Installation

The basic packages you'll have to install in order to use Grafoo are core and babel-plugin.

```
$ npm i @grafoo/core && npm i -D @grafoo/babel-plugin
```

### Configure babel

In `@grafoo/babel-plugin` the option `schema` is a path to a GraphQL schema in your file system relative to the root of your project and `idFields` is an array of strings that represent the fields that Grafoo will automatically insert on your queries to build unique identifiers in order to normalize the cache. **Both options are required**.

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

### Writing your app

From `@grafoo/core` you will import the factory that creates the client instance and from submodule `@grafoo/core/tag` you'll import the `graphql` or `gql` tag that will be compiled at build time.

```js
import createClient from "@grafoo/core";
import gql from "@grafoo/core/tag";

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

const client = createClient(fetchQuery);

const USER_QUERY = gql`
  query($id: ID!) {
    user(id: $id) {
      name
    }
  }
`;

const variables = { id: 123 };

client.execute(USER_QUERY, variables).then(data => {
  // Write to cache
  client.write(USER_QUERY, variables, data);

  // Do whatever with returned data
  console.log(data);

  // Read from cache at a later stage
  console.log(client.read(USER_QUERY, variables));
});

// If you wish to reset (clear) the cache:
client.reset();
```

### With a framework

Here is how it would go for you to write a simple react app.

#### `index.js`

```jsx
import React from "react";
import ReactDom from "react-dom";
import createClient from "@grafoo/core";
import { Provider } from "@grafoo/react";

import Posts from "./Posts";

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

const client = createClient(fetchQuery);

ReactDom.render(
  <Provider client={client}>
    <Posts />
  </Provider>,
  document.getElementById("mnt")
);
```

#### `Posts.js`

```jsx
import React from "react";
import gql from "@grafoo/core/tag";
import { Consumer } from "@grafoo/react";

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
    <Consumer query={ALL_POSTS} variables={{ orderBy: "createdAt_DESC" }}>
      {({ client, load, loaded, loading, errors, allPosts }) => (
        <marquee>👆 do whatever you want with the variables above 👆</marquee>
      )}
    </Consumer>
  );
}
```

### Mutations

```jsx
import React from "react";
import gql from "@grafoo/core/tag";
import { Consumer } from "@grafoo/react";

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

const CREATE_POST = gql`
  mutation createPost($content: String, $title: String, $authorId: ID) {
    createPost(content: $content, title: $title, authorId: $authorId) {
      title
      content
      createdAt
      updatedAt
    }
  }
`;

const mutations = {
  createPost: {
    query: CREATE_POST,
    optimisticUpdate: ({ allPosts }, variables) => ({
      allPosts: [{ ...variables, id: "tempID" }, ...allPosts]
    }),
    update: ({ allPosts }, data) => ({
      allPosts: allPosts.map(p => (p.id === "tempID" ? data.createPost : p))
    })
  }
};

const submit = mutate => event => {
  event.preventDefault();

  const { title, content } = event.target.elements;

  mutate({ title: title.value, content: content.value });
};

export default function PostForm() {
  return (
    <Consumer query={ALL_POSTS} variables={{ orderBy: "createdAt_DESC" }} mutations={mutations}>
      {({ createPost }) => (
        <form onSubmit={submit(createPost)}>
          <input name="title" />
          <textarea name="content" />
          <button>submit</button>
        </form>
      )}
    </Consumer>
  );
}
```

## LICENSE

[MIT](https://github.com/grafoojs/grafoo/blob/master/LICENSE)
