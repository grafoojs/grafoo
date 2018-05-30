const fs = require("fs");
const path = require("path");
const { transform } = require("@babel/core");

const config = { sourceMap: "inline", ast: false };

try {
  Object.assign(config, JSON.parse(fs.readFileSync(path.join(process.cwd(), ".babelrc"), "utf-8")));
} catch (e) {
  Object.assign(config, {
    presets: [["@babel/preset-env", { targets: { node: "current" } }], "@babel/preset-typescript"]
  });
}

module.exports.process = (src, path) =>
  transform(src, Object.assign({}, config, { filename: path })).code;
