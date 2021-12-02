import pluginTester from "babel-plugin-tester";
import plugin from "babel-plugin-macros";

let output = `
let query = {
  document: "{authors{__typename id name}}",
  operation: {
    select: {
      authors: {
        scalars: ["__typename", "id", "name"]
      }
    }
  }
};
`.trim();

pluginTester({
  plugin,
  pluginName: "@grafoo/macro",
  babelOptions: { filename: __filename },
  tests: {
    "should throw if a tagged template string literal has expressions in it": {
      code: `
        import graphql from "../src/macro";
        let query = graphql\`{ user(id: "\${1}") { name } }\`;
      `,
      error: true
    },
    "should replace a tagged template literal with the compiled grafoo object": {
      code: `
        import graphql from "../src/macro";
        let query = graphql\`{ authors {name} }\`;
      `,
      output
    }
  }
});
