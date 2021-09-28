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
        let query = gql\`{ hello }\`;
      `,
      error: true
    },
    "should throw if a tagged template string literal has expressions in it": {
      code: `
        import gql from "@grafoo/core/tag";
        let query = gql\`{ user(id: "\${1}") { name } }\`;
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
        let query = gql\`{ hello }\`;
      `,
      error: true
    },
    "should throw if during client instatiation options is passed with a type other then object": {
      code: `
        import createClient from "@grafoo/core";
        let query = createClient(someTransport, "I AM ERROR");
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
        let query = createClient(someTransport);
      `,
      error: true
    },
    "should replace a tagged template literal with the compiled grafoo object": {
      code: `
        import gql from "@grafoo/core/tag";
        let query = gql\`
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
        let query = gql\`
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
    "should generate md5 hash and add it to object if the option generateIds is specified": {
      pluginOptions: {
        schema: "__tests__/schema.graphql",
        idFields: ["id"],
        generateIds: true
      },
      code: `
        import gql from "@grafoo/core/tag";
        let query = gql\`
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
    "should not generate md5 hash and add it to object if the option generateIds is falsey": {
      pluginOptions: {
        schema: "__tests__/schema.graphql",
        idFields: ["id"]
      },
      code: `
        import gql from "@grafoo/core/tag";
        let query = gql\`
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
        let query = createClient(someTransport);
      `,
      snapshot: true
    },
    "should include `idFields` in the client instantiation if not present in options": {
      code: `
        import createClient from "@grafoo/core";
        let query = createClient(someTransport, {});
      `,
      snapshot: true
    },
    "should include `idFields` in the client instantiation if options is a variable": {
      code: `
        import createClient from "@grafoo/core";
        let options = {};
        let query = createClient(someTransport, options);
      `,
      snapshot: true
    },
    "should overide `idFields` in the client instantiation if options is a variable": {
      code: `
        import createClient from "@grafoo/core";
        let options = { idFields: ["err"] };
        let query = createClient(someTransport, options);
      `,
      snapshot: true
    },
    "should throw if `idFields` in the client instantiation if options is not an object variable": {
      code: `
        import createClient from "@grafoo/core";
        let options = [];
        let query = createClient(someTransport, options);
      `,
      error: true
    },
    "should include `idFields` in the client instantiation even if options are provided": {
      code: `
        import createClient from "@grafoo/core";
        let query = createClient(someTransport, {
          headers: () => ({ authorization: "some-token" })
        });
      `,
      snapshot: true
    }
  }
});
