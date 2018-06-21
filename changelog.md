# Changelog

## v0.0.1-alpha.15

### Fixes

- [babel-plugin] fix bug the was preventing fragments to be compiled in babel-plugin `sort-query`
- [babel-plugin] improve coverage

## v0.0.1-alpha.14

### Fixes

- [react] same as before but now it's working

## v0.0.1-alpha.13

### Fixes

- [react] fix a bug that was preventing component setState to work within the consumer render function

## v0.0.1-alpha.12

### Features

- replace `@babel/preset-typescript` for `rollup-plugin-typescript2` in `grafoo-bundle`

## v0.0.1-alpha.11

### Features

- bindings generated mutation functions now resolve with the mutation response
- bindings mutations `prop` does not require the update hook anymore

### Fixes

- bindings `loading` flag is always false whenever the `load` is triggered
