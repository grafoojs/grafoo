# How to use this

## Install dependencies

```sh
$ yarn
```

## Link Grafoo dependencies

On each of the Grafoo dependencies directories (core, babel-plugin-tag and react) run the `yarn link` command. example:

```sh
$ cd packages/react
$ yarn link
$ cd ../../examples/react
$ yarn link @grafoo/react
```

## Run dev server

```sh
$ yarn start
```
