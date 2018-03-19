const expect = require("expect");
const snapshot = require("snap-shot");
const babel = require("babel-core");

const plugin = require(".");

const transform = (program, opts) =>
  babel.transform(program, {
    plugins: [[plugin, Object.assign({ schema: "schema.graphql" }, opts)]]
  });

describe("@grafoo/loader", () => {
  afterEach(() => {
    process.env.NODE_ENV = "test";
  });

  it("should throw if a import is not default", () => {
    const program = 'import { gql } from "@grafoo/loader";';

    expect(() => transform(program)).toThrowError("@grafoo/loader is a default import!");
  });

  it("should name the default export `gql` or `graphql`", () => {
    const program1 = 'import gql from "@grafoo/loader";';
    const program2 = 'import graphql from "@grafoo/loader";';
    const program3 = 'import someDefaultSpecifier from "@grafoo/loader";';

    expect(() => transform(program1)).not.toThrow();
    expect(() => transform(program2)).not.toThrow();
    expect(() => transform(program3)).toThrowError(
      "@grafoo/loader should be imported as " +
        "`gql` or `graphql`, instead got: `someDefaultSpecifier`!"
    );
  });

  it("should remove the imported path", () => {
    const program = 'import gql from "@grafoo/loader";';

    expect(transform(program).code).toBe("");
  });

  it("should throw if a schema is not specified", () => {
    const program = `
      import gql from "@grafoo/loader";

      const query = gql\`{ hello }\`;
    `;

    expect(() => transform(program, { schema: undefined })).toThrowError(
      "@grafoo/loader needs a schema!"
    );
  });

  it("should throw if a schema path points to a inexistent file", () => {
    const program = `
      import gql from "@grafoo/loader";

      const query = gql\`{ hello }\`;
    `;

    expect(() => transform(program, { schema: "?" })).toThrow();
  });

  it("should throw if a tagged template string literal has expressions in it", () => {
    const program = `
      import gql from "@grafoo/loader";

      const id = 123;

      const query = gql\`{ user(id: "\${id}") { name } }\`;
    `;

    expect(() => transform(program).code).toThrowError(
      "@grafoo/loader does not support interpolation in a graphql template string!"
    );
  });

  it("should replace a tagged template literal with the compiled grafoo object", () => {
    const program = `
      import gql from "@grafoo/loader";

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
    `;

    snapshot(transform(program, { fields: ["id"] }).code);
  });

  it("should compress query in production", () => {
    const program = `
      import gql from "@grafoo/loader";

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
    `;

    process.env.NODE_ENV = "production";

    snapshot(transform(program, { fields: ["id"] }).code);
  });
});
