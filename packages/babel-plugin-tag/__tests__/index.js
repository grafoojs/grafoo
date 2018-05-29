import pluginTester from "babel-plugin-tester";
import plugin from "../src";

pluginTester({
  plugin,
  pluginName: "@grafoo/babel-plugin-tag",
  pluginOptions: {
    schema: "__tests__/schema.graphql",
    fieldsToInsert: ["id"]
  },
  tests: {
    "should throw if a import is not default": {
      code: 'import { gql } from "@grafoo/tag";',
      error: true
    },
    "should throw if a schema is not specified": {
      pluginOptions: {
        schema: undefined
      },
      code: `
        import gql from "@grafoo/tag";
        const query = gql\`{ hello }\`;
      `,
      error: true
    },
    "should throw if a tagged template string literal has expressions in it": {
      code: `
        import gql from "@grafoo/tag";
        const id = 1;
        const query = gql\`{ user(id: "\${id}") { name } }\`;
      `,
      error: true
    },
    "should remove the imported path": {
      code: 'import gql from "@grafoo/tag";',
      snapshot: true
    },
    "should replace a tagged template literal with the compiled grafoo object": {
      code: `
        import gql from "@grafoo/tag";
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
        fieldsToInsert: ["id"],
        compress: true
      },
      code: `
        import gql from "@grafoo/tag";
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
        const query = createClient("http://gql.api");
      `,
      snapshot: true
    },
    "should include `idFields` in the client instantiation even if options are provided": {
      code: `
        import createClient from "@grafoo/core";
        const query = createClient("http://gql.api", {
          headers: () => ({ authorization: "some-token" })
        });
      `,
      snapshot: true
    },
    "should throw if during client instatiation options is passed with a type other then object": {
      code: `
        import createClient from "@grafoo/core";
        const query = createClient("http://gql.api", "I AM ERROR");
      `,
      error: true
    },
    "should throw if the type of some field in `fieldsToInsert` is not of type string": {
      pluginOptions: {
        schema: "__tests__/schema.graphql",
        fieldsToInsert: ["id", true]
      },
      code: `
        import createClient from "@grafoo/core";
        const query = createClient("http://gql.api", "I AM ERROR");
      `,
      error: true
    }
  }
});
