# How to use this

## Install dependencies

```
$ yarn
```

## Link Grafoo dependencies

On each of the Grafoo dependencies directories (core, babel-plugin-tag and preact) run the `yarn link` command. example:

```
$ cd packages/preact
$ yarn link
$ cd ../../examples/preact
$ yarn link @grafoo/preact
```

## Run dev server

```
$ yarn start
```
