# Contributing

## Not sure where to start?

If you're not sure where to start? You'll probably want to learn a bit about a few topics before getting dirt in your hands.

- [ASTs](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (Abstract Syntax Tree): this project makes heavy use of code transformation with Babel and GraphQL. Check out [AST Explorer](http://astexplorer.net/) to learn more about ASTs interactively
- [Babel](https://github.com/babel/babel): I'd recommend a read to the [the Babel Plugin Handbook](https://github.com/thejameskyle/babel-handbook/blob/master/translations/en/plugin-handbook.md#babel-plugin-handbook) to understand how a plugin is written.
- [GraphQL](https://graphql.org/graphql-js/graphql): the GraphQL.js module is not only meant to build servers, it also exports a core subset of GraphQL functionality for creation of GraphQL type systems.
- [Lerna](https://github.com/lerna/lerna): this is mono repository and we use Lerna to manage our packages.
- [Yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/): Lerna is setup to be used with Yarn workspaces.

## Chat

Have read this contributing guide and still need some help? Feel free to ping me on twitter, I can be found as [@miguel_albernaz](https://twitter.com/miguel_albernaz).

## Disclaimer

**As Lerna is configured in this package to be used with Yarn, not using NPM will save you a lot of time.**

## Setup

```sh
$ git clone https://github.com/grafoojs/grafoo
$ cd grafoo
$ yarn # this command will install dependencies and automatically build every package
```

## Build packages

#### Build all packages

As mentioned above after every `yarn` install all the packages are built automatically. But if you want to build then anyway just run:

```sh
$ yarn prepare
```

#### Build single package

```sh
$ cd packages/[any-package]
$ yarn build
```

## Run tests

#### All tests

```sh
$ yarn test
```

#### All tests with coverage

I recomend the usage of [NPX](https://www.npmjs.com/package/npx) for any Lerna command if you don't want to install it globally.

```sh
$ npx lerna run test:coverage
```

#### Test individual package

```sh
$ cd packages/[any-package]
$ yarn test
```

#### Test individual package in watch mode

```sh
$ cd packages/[any-package]
$ yarn test --watch
```

#### Test individual package with coverage

```sh
$ cd packages/[any-package]
$ yarn test:coverage
```
