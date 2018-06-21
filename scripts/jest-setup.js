const fs = require("fs");
const path = require("path");
const { transform } = require("@babel/core");

const config = Object.assign(
  { sourceMap: "inline", ast: false },
  JSON.parse(fs.readFileSync(path.join(process.cwd(), ".babelrc"), "utf-8"))
);

module.exports.process = (src, path) =>
  transform(src, Object.assign({}, config, { filename: path }));
