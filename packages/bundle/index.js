const fs = require("fs");
const path = require("path");
const { rollup } = require("rollup");
const { terser } = require("rollup-plugin-terser");
const babel = require("rollup-plugin-babel");
const buble = require("rollup-plugin-buble");
const nodeResolve = require("rollup-plugin-node-resolve");
const fileSize = require("rollup-plugin-filesize");

module.exports = async function build({ input, skipCompress, rootPath }) {
  const { peerDependencies = {} } = JSON.parse(
    fs.readFileSync(path.join(rootPath, "package.json"), "utf-8")
  );

  const bundle = await rollup({
    input: path.join(rootPath, input),
    external: Object.keys(peerDependencies),
    plugins: [
      nodeResolve(),
      resolveTSPlugin(),
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
};

const resolveTSPlugin = () => ({
  resolveId(importee, importer) {
    if (importer) {
      const tsImportee = path.resolve(path.dirname(importer), importee + ".ts");

      if (fs.existsSync(tsImportee)) return tsImportee;
    }

    return importee;
  }
});
