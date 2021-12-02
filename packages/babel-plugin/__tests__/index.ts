import pluginTester from "babel-plugin-tester";
import plugin from "../src";

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
  pluginName: "@grafoo/babel-plugin",
  tests: {
    "should remove the imported path": {
      code: 'import { graphql, gql } from "@grafoo/core";',
      output: ""
    },
    "should throw if a tagged template string literal has expressions in it": {
      code: `
        import { graphql } from "@grafoo/core";
        let query = graphql\`{ user(id: "\${1}") { name } }\`;
      `,
      error: true
    },
    "should replace a tagged template literal with the compiled grafoo object": {
      code: `
        import { graphql } from "@grafoo/core";
        let query = graphql\`{ authors {name} }\`;
      `,
      output
    },
    "should be able to use named import gql from @grafoo/core": {
      code: `
        import { gql } from "@grafoo/core";
        let query = gql\`{ authors {name} }\`;
      `,
      output
    }
  }
});
