import plugin from "../src";
import { parse } from "acorn";

let transform = (input: string) =>
  plugin().transform.call(
    {
      parse: (code: string) =>
        parse(code, {
          sourceType: "module",
          ecmaVersion: 9
        })
    },
    input,
    "file.js"
  );

let output =
  'let query = {"document":"{authors{__typename id name}}","operation":{"select":{"authors":{"scalars":["__typename","id","name"]}}}};';

describe("@grafoo/rollup-plugin", () => {
  it("should remove the imported path", () => {
    let { code } = transform('import { graphql, gql } from "@grafoo/core";');
    let output = "";

    expect(code).toBe(output);
  });

  it("should throw if a tagged template string literal has expressions in it", () => {
    let code = `
      import { graphql } from "@grafoo/core";
      let query = graphql\`{ user(id: "\${1}") { name } }\`;
    `;

    expect(() => transform(code)).toThrow();
  });

  it("should replace a tagged template literal with the compiled grafoo object", () => {
    let { code } = transform(`
      import { graphql } from "@grafoo/core";
      let query = graphql\`{ authors {name} }\`;
    `);

    expect(code.trim()).toBe(output);
  });

  it("should be able to use named import gql from @grafoo/core", () => {
    let { code } = transform(`
      import { gql } from "@grafoo/core";
      let query = gql\`{ authors {name} }\`;
    `);

    expect(code.trim()).toBe(output);
  });
});
