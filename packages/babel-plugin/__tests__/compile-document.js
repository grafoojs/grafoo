import * as babel from "@babel/core";
import plugin from "../src";

const transform = (program, opts) =>
  babel.transform(program, {
    plugins: [
      [plugin, Object.assign({ schema: "__tests__/schema.graphql", idFields: ["id"] }, opts)]
    ]
  });

describe("compile document", () => {
  it("should throw if a schema path points to a inexistent file", () => {
    const program = `
      import gql from "@grafoo/core/tag";
      const query = gql\`{ hello }\`;
    `;

    expect(() => transform(program, { schema: "?" })).toThrow();
  });

  it("should throw if more then one operation is specified", () => {
    const program = `
      import gql from "@grafoo/core/tag";
      const query = gql\`
        { hello }
        { goodbye }
      \`;
    `;

    expect(() => transform(program)).toThrow();
  });

  it("should accept fragments", () => {
    const program = `
      import gql from "@grafoo/core/tag";
      const query = gql\`
        fragment UserInfo on User {
          name
          bio
        }
      \`;
    `;

    expect(() => transform(program)).not.toThrow();
  });
});
