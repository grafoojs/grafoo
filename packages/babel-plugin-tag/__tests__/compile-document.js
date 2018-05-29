import * as babel from "@babel/core";
import plugin from "../src";

const transform = (program, opts) =>
  babel.transform(program, {
    plugins: [[plugin, Object.assign({ schema: "__tests__/schema.graphql" }, opts)]]
  });

describe("compile document", () => {
  it("should throw if a schema path points to a inexistent file", () => {
    const program = `
      import gql from "@grafoo/tag";
      const query = gql\`{ hello }\`;
    `;

    expect(() => transform(program, { schema: "?" })).toThrow();
  });

  it("should throw if more then one operation was specified in a query document", () => {
    const program = `
      import gql from "@grafoo/tag";
      const query = gql\`
        query { hello }
        query { goodbye }
      \`;
    `;

    expect(() => transform(program)).toThrow();
  });
});
