let fs = require("fs");
let path = require("path");
let { transform } = require("@babel/core");

let config = Object.assign(
  { sourceMap: "inline", ast: false },
  JSON.parse(fs.readFileSync(path.join(process.cwd(), ".babelrc"), "utf-8"))
);

module.exports.process = (src, path) =>
  transform(src, Object.assign({}, config, { filename: path }));
