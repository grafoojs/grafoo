import pluginTester from "babel-plugin-tester";
import plugin from "../src";

pluginTester({
  plugin,
  pluginName: "@grafoo/babel-plugin",
  pluginOptions: {
    schema: "__tests__/schema.graphql",
    idFields: ["id"]
  },
  tests: {
    "should throw if a import is not default": {
      code: 'import { gql } from "@grafoo/core/tag";',
      error: true
    },
    "should throw if a schema is not present on the root directory": {
      pluginOptions: {
        idFields: ["id"]
      },
      code: `
        import gql from "@grafoo/core/tag";
        const query = gql\`{ hello }\`;
      `,
      error: true
    },
    "should throw if a tagged template string literal has expressions in it": {
      code: `
        import gql from "@grafoo/core/tag";
        const query = gql\`{ user(id: "\${1}") { name } }\`;
      `,
      error: true
    },
    "should remove the imported path": {
      code: 'import gql from "@grafoo/core/tag";',
      snapshot: true
    },
    "should throw if idFields is not defined": {
      pluginOptions: {
        schema: "__tests__/schema.graphql"
      },
      code: `
        import gql from "@grafoo/core/tag";
        const query = gql\`{ hello }\`;
      `,
      error: true
    },
    "should throw if during client instatiation options is passed with a type other then object": {
      code: `
        import createClient from "@grafoo/core";
        const query = createClient(someTransport, "I AM ERROR");
      `,
      error: true
    },
    "should throw if the type of some field in `idFields` is not of type string": {
      pluginOptions: {
        schema: "__tests__/schema.graphql",
        idFields: ["id", true]
      },
      code: `
        import createClient from "@grafoo/core";
        const query = createClient(someTransport, "I AM ERROR");
      `,
      error: true
    },
    "should replace a tagged template literal with the compiled grafoo object": {
      code: `
        import gql from "@grafoo/core/tag";
        const query = gql\`
          query($start: Int!, $offset: Int!, $id: ID!) {
            posts(start: $start, offset: $offset) {
              title
              body
              createdAt
              tags { name }
              authors { name username }
            }
            user(id: $id) { name username }
          }
        \`;
      `,
      snapshot: true
    },
    "should compress the query string if the option compress is specified": {
      pluginOptions: {
        schema: "__tests__/schema.graphql",
        idFields: ["id"],
        compress: true
      },
      code: `
        import gql from "@grafoo/core/tag";
        const query = gql\`
          query($start: Int!, $offset: Int!, $id: ID!) {
            posts(start: $start, offset: $offset) {
              title
              body
              createdAt
              tags { name }
              authors { name username }
            }
            user(id: $id) { name username }
          }
        \`;
      `,
      snapshot: true
    },
    "should include `idFields` in the client instantiation if options are not provided": {
      code: `
        import createClient from "@grafoo/core";
        const query = createClient(someTransport);
      `,
      snapshot: true
    },
    "should include `idFields` in the client instantiation even if options are provided": {
      code: `
        import createClient from "@grafoo/core";
        const query = createClient(someTransport, {
          headers: () => ({ authorization: "some-token" })
        });
      `,
      snapshot: true
    }
  }
});
