let fs = require("fs");
let path = require("path");
let { transform } = require("@babel/core");

let config = Object.assign(
  { sourceMap: "inline", ast: false },
  require(path.join(process.cwd(), ".babelrc.json"))
);

module.exports.process = (src, path) =>
  transform(src, Object.assign({}, config, { filename: path }));
