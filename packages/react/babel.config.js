module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-react",
    "@babel/preset-typescript"
  ],
  plugins: [["module:@grafoo/babel-plugin", { schema: "schema.graphql", idFields: ["id"] }]]
};
