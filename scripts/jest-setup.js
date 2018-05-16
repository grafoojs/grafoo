const fs = require("fs");
const path = require("path");
const { transform } = require("@babel/core");

let config;
try {
  config = JSON.parse(fs.readFileSync(path.join(process.cwd(), ".babelrc"), "utf-8"));
} catch (e) {
  config = {
    presets: [["@babel/preset-env", { targets: { node: "current" } }], "@babel/preset-typescript"]
  };
}

module.exports = {
  process: src => {
    return transform(src, config);
  }
};
