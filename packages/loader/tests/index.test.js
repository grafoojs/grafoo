const test = require("ava");
const babel = require("@babel/core");

const plugin = require("..");

const transform = (program, opts) =>
  babel.transform(program, {
    plugins: [[plugin, Object.assign({ schema: "schema.graphql" }, opts)]]
  });

test.afterEach(() => {
  process.env.NODE_ENV = "test";
});

test("should throw if a import is not default", t => {
  const program = 'import { gql } from "@grafoo/loader";';

  t.throws(() => transform(program));
});

test("should name the default export `gql` or `graphql`", t => {
  const program1 = 'import gql from "@grafoo/loader";';
  const program2 = 'import graphql from "@grafoo/loader";';
  const program3 = 'import someDefaultSpecifier from "@grafoo/loader";';

  t.notThrows(() => transform(program1));
  t.notThrows(() => transform(program2));
  t.throws(() => transform(program3));
});

test("should remove the imported path", t => {
  const program = 'import gql from "@grafoo/loader";';

  t.is(transform(program).code, "");
});

test("should throw if a schema is not specified", t => {
  const program = `
    import gql from "@grafoo/loader";
    const query = gql\`{ hello }\`;
  `;

  t.throws(() => transform(program, { schema: undefined }));
});

test("should throw if a schema path points to a inexistent file", t => {
  const program = `
    import gql from "@grafoo/loader";
    const query = gql\`{ hello }\`;
  `;

  t.throws(() => transform(program, { schema: "?" }));
});

test("should throw if a tagged template string literal has expressions in it", t => {
  const program = `
    import gql from "@grafoo/loader";
    const id = 1;
    const query = gql\`{ user(id: "\${id}") { name } }\`;
  `;

  t.throws(() => transform(program));
});

test("should replace a tagged template literal with the compiled grafoo object", t => {
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

  t.snapshot(transform(program, { fields: ["id"] }).code);
});

test("should compress query in production", t => {
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

  t.snapshot(transform(program, { fields: ["id"] }).code);
});
