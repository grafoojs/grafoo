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
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    "graphql/template-strings": ["error", { schemaString, tagName: "graphql" }]
  }
};
