const fs = require("fs");
const path = require("path");

const schemaString = fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf-8");

module.exports = {
  extends: ["eslint:recommended", "plugin:react/recommended"],
  plugins: ["react", "graphql"],
  settings: {
    react: {
      pragma: "h"
    }
  },
  parserOptions: {
    ecmaVersion: 2017,
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true
    }
  },
  rules: {
    "graphql/template-strings": ["error", { schemaString, tagName: "graphql" }],
    "react/prop-types": "off"
  }
};
