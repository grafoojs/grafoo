#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const mri = require("mri");
const { rollup } = require("rollup");
const { terser } = require("rollup-plugin-terser");
const babel = require("rollup-plugin-babel");
const buble = require("rollup-plugin-buble");
const nodeResolve = require("rollup-plugin-node-resolve");
const fileSize = require("rollup-plugin-filesize");

(async () => {
  const opts = mri(process.argv.slice(2));
  const CWD = process.cwd();

  const createDef = exec("tsc -p tsconfig.build.json");

  createDef.stdout.pipe(process.stdout);
  createDef.stderr.pipe(process.stderr);

  createDef.on("close", () => build(Object.assign({}, opts, { rootPath: CWD })));
})();

async function build({ input, ["skip-compression"]: skipCompress, rootPath }) {
  const bundle = await rollup({
    input: path.join(rootPath, input),
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
    file: path.join(rootPath, "dist/index.js"),
    sourcemap: true,
    format: "esm",
    treeshake: {
      propertyReadSideEffects: false
    }
  });
}

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
