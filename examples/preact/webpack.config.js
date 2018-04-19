const path = require("path");
const webpack = require("webpack");
const HtmlPlugin = require("html-webpack-plugin");

module.exports = () => ({
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.join(__dirname, "dist")
  },
  module: {
    rules: [{ test: /\.js$/, loader: "babel-loader", exclude: /node_modules/ }]
  },
  plugins: [
    new HtmlPlugin({ template: "./src/index.html" }),
    new webpack.HotModuleReplacementPlugin()
  ],
  devServer: {
    host: "0.0.0.0",
    port: 3000,
    stats: "errors-only",
    hot: true
  }
});
