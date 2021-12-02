module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-react",
    "@babel/preset-typescript"
  ],
  env: {
    test: {
      plugins: ["module:@grafoo/babel-plugin"]
    }
  }
};
