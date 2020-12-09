import * as babel from "@babel/core";
import plugin from "../src";

let transform = (program, opts) =>
  babel.transform(program, {
    plugins: [
      [plugin, Object.assign({ schema: "__tests__/schema.graphql", idFields: ["id"] }, opts)],
    ],
  });

describe("compile document", () => {
  it("should throw if a schema path points to a inexistent file", () => {
    let program = `
      import gql from "@grafoo/core/tag";
      let query = gql\`{ hello }\`;
    `;

    expect(() => transform(program, { schema: "?" })).toThrow();
  });

  it("should throw if more then one operation is specified", () => {
    let program = `
      import gql from "@grafoo/core/tag";
      let query = gql\`
        { hello }
        { goodbye }
      \`;
    `;

    expect(() => transform(program)).toThrow();
  });

  it("should accept fragments", () => {
    let program = `
      import gql from "@grafoo/core/tag";
      let query = gql\`
        fragment UserInfo on User {
          name
          bio
        }
      \`;
    `;

    expect(() => transform(program)).not.toThrow();
  });

  it("should accept named queries", () => {
    let program = `
      import gql from "@grafoo/core/tag";
      let query = gql\`
        query NamedQuery {
          me { id }
        }
      \`;
    `;

    expect(() => transform(program)).not.toThrow();
  });

  it("should accept named queries with arguments", () => {
    let program = `
      import gql from "@grafoo/core/tag";
      let query = gql\`
        query NamedQuery($var: ID!) {
          post(id: $var) {
            id
            title
          }
        }
      \`;
    `;

    expect(() => transform(program)).not.toThrow();
  });
});
