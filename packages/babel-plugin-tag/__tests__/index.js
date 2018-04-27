import test from "ava";
import * as babel from "@babel/core";

import plugin from "../src";

const transform = (program, opts) =>
  babel.transform(program, {
    plugins: [[plugin, Object.assign({ schema: "__tests__/schema.graphql" }, opts)]]
  });

test.afterEach(() => {
  process.env.NODE_ENV = "test";
});

test("should throw if a import is not default", t => {
  const program = 'import { gql } from "@grafoo/core/tag";';

  t.throws(() => transform(program));
});

test("should name the default export `gql` or `graphql`", t => {
  const program1 = 'import gql from "@grafoo/core/tag";';
  const program2 = 'import graphql from "@grafoo/core/tag";';
  const program3 = 'import someDefaultSpecifier from "@grafoo/core/tag";';

  t.notThrows(() => transform(program1));
  t.notThrows(() => transform(program2));
  t.throws(() => transform(program3));
});

test("should remove the imported path", t => {
  const program = 'import gql from "@grafoo/core/tag";';

  t.is(transform(program).code, "");
});

test("should throw if a schema is not specified", t => {
  const program = `
    import gql from "@grafoo/core/tag";
    const query = gql\`{ hello }\`;
  `;

  t.throws(() => transform(program, { schema: undefined }));
});

test("should throw if a schema path points to a inexistent file", t => {
  const program = `
    import gql from "@grafoo/core/tag";
    const query = gql\`{ hello }\`;
  `;

  t.throws(() => transform(program, { schema: "?" }));
});

test("should throw if a tagged template string literal has expressions in it", t => {
  const program = `
    import gql from "@grafoo/core/tag";
    const id = 1;
    const query = gql\`{ user(id: "\${id}") { name } }\`;
  `;

  t.throws(() => transform(program));
});

test("should replace a tagged template literal with the compiled grafoo object", t => {
  const program = `
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
  `;

  t.snapshot(transform(program, { fieldsToInsert: ["id"] }).code);
});

test("should compress query in production", t => {
  const program = `
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
  `;

  process.env.NODE_ENV = "production";

  t.snapshot(transform(program, { fieldsToInsert: ["id"] }).code);
});
