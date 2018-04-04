# Grafoo

## What?

Grafoo is an experimental graphql client under heavy development. It's core goals are:

* to have a minimal footprint on bundlesize
* to have a minimal runtime overhead
* to provide view layers for all major frameworks
* easebility of use

## Why?

Mobile traffic. Grafoo is targeted to low-end devices.

## How?

Grafoo parses all queries beforehand with the help of a babel plugin. At runtime the cache normalizes query results to then serve then to the application.

## install

```shell
npm i @grafoo/core @grafoo/preact && \
npm i -D @grafoo/loader
```

## setup

```js
import createClient from "@grafoo/core";

const client = createClient("http://some-graphql-api.com", {
  fetchOptions: {
    /* can be a function as well */
  },
  idFromProps: obj => obj.id
});
```

## LICENSE

[MIT](https://github.com/malbernaz/grafoo/blob/master/LICENSE)
