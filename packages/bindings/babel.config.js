module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }], "@babel/preset-typescript"],
  env: {
    test: {
      plugins: [
        [
          "module:@grafoo/babel-plugin",
          { schema: "schema.graphql", idFields: ["id", "__typename"] }
        ]
      ]
    }
  }
};
