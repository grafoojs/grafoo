#!/usr/bin/env node

const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const mri = require("mri");
const { rollup } = require("rollup");
const { terser } = require("rollup-plugin-terser");
const babel = require("rollup-plugin-babel");
const buble = require("rollup-plugin-buble");
const nodeResolve = require("rollup-plugin-node-resolve");
const fileSize = require("rollup-plugin-filesize");

const exec = promisify(require("child_process").exec);

(async () => {
  const { input, ["skip-compression"]: skipCompress } = mri(process.argv.slice(2));
  const CWD = process.cwd();

  await exec("tsc -p tsconfig.build.json");

  const bundle = await rollup({
    input: path.join(CWD, input),
    external: ["preact"],
    plugins: [
      nodeResolve(),
      resolveTS(),
      babel({
        presets: [
          ["@babel/preset-env", { targets: { node: 10 }, modules: false, loose: true }],
          "@babel/preset-typescript"
        ]
      }),
      buble({
        transforms: {
          dangerousForOf: true,
          dangerousTaggedTemplateString: true
        }
      }),
      fileSize(),
      !skipCompress &&
        terser({
          sourceMap: true,
          output: { comments: false },
          compress: { keep_infinity: true, pure_getters: true },
          warnings: true,
          toplevel: true,
          mangle: {}
        })
    ].filter(Boolean)
  });

  await bundle.write({
    file: path.join(CWD, "dist/index.js"),
    sourcemap: true,
    format: "esm",
    treeshake: {
      propertyReadSideEffects: false
    }
  });
})();

function resolveTS() {
  return {
    resolveId(importee, importer) {
      if (importer) {
        const tsImportee = path.resolve(path.dirname(importer), importee + ".ts");

        if (fs.existsSync(tsImportee)) importee = tsImportee;
      }

      return importee;
    }
  };
}
