import { walk } from "estree-walker";
import { AcornNode, Plugin } from "rollup";
import MagicString from "magic-string";
import type { ImportDeclaration, Node } from "estree";
import { FilterPattern, createFilter } from "@rollup/pluginutils";
import compileDocument from "@grafoo/compiler";

type Options = {
  include?: FilterPattern;
  exclude?: FilterPattern;
  sourceMap?: boolean;
};

export default function grafoo(options?: Options): Plugin {
  let { include = "**/*.{js,jsx,ts,tsx}", exclude, sourceMap = true } = options ?? {};
  let filter = createFilter(include, exclude);

  return {
    name: "@grafoo/rollup-plugin",
    transform(code, id) {
      if (!filter(id)) return null;

      let ast: AcornNode;
      try {
        ast = this.parse(code);
      } catch (err) {
        err.message += ` in ${id}`;
        throw err;
      }

      let ms = new MagicString(code);
      let edited = false;
      let tags = [];

      function removeImportSpecifier({ start, end }) {
        while (/\s/.test(code[start - 1])) start -= 1;
        while (/\s|,/.test(code[end + 1])) end += 1;
        ms.remove(start, end);
        edited = true;
      }

      function removeImportDeclaration({ start, end }) {
        ms.remove(start, end);
        edited = true;
      }

      function replaceTemplateExpression({ start, end }, source: string) {
        ms.overwrite(start, end, source);
        edited = true;
      }

      walk(ast, {
        enter(node: Node, parent) {
          let parentNode = parent as ImportDeclaration;

          if (node.type === "ImportSpecifier") {
            if (parentNode.source.value !== "@grafoo/core") return;

            let { name } = node.local;

            if (["graphql", "gql"].includes(name)) {
              tags.push(name);
              removeImportSpecifier(node as any);
              this.remove();

              if (!parentNode.specifiers.filter((s) => s.local.name !== name).length) {
                removeImportDeclaration(parent as any);
              }
            }
          }

          if (node.type === "TaggedTemplateExpression") {
            if (!tags.includes((node.tag as any).name)) return;

            let { quasis, expressions } = node.quasi;

            if (expressions.length) {
              throw new Error(
                `interpolation is not supported in a grafoo graphql tagged template literal.`
              );
            }

            let source = quasis.reduce((q, s) => q + s.value.raw, "");
            let query = compileDocument(source);
            replaceTemplateExpression(node as any, query);
          }
        }
      });

      if (!edited) return null;

      return {
        code: ms.toString(),
        map: sourceMap ? ms.generateMap() : null
      };
    }
  };
}
