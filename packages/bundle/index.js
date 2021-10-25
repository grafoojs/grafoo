let fs = require("fs");
let path = require("path");
let rollup = require("rollup").rollup;
let fileSize = require("rollup-plugin-filesize");
let nodeResolve = require("rollup-plugin-node-resolve");
let terser = require("rollup-plugin-terser").terser;
let typescript = require("rollup-plugin-typescript2");
let ts = require("typescript");

module.exports = function build(opts) {
  let pkg = JSON.parse(fs.readFileSync(path.join(opts.rootPath, "package.json"), "utf-8"));
  let tsconfig = JSON.parse(fs.readFileSync(path.join(opts.rootPath, "tsconfig.json"), "utf-8"));
  let peerDependencies = pkg.peerDependencies || {};

  tsconfig.compilerOptions.target = "esnext";
  tsconfig.compilerOptions.module = "esnext";
  tsconfig.compilerOptions.declaration = true;
  tsconfig.compilerOptions.outDir = path.join(opts.rootPath, "dist");

  return rollup({
    input: path.join(opts.rootPath, opts.input),
    external: Object.keys(peerDependencies),
    sourcemap: true,
    plugins: [
      nodeResolve(),
      typescript({
        typescript: ts,
        tsconfigOverride: tsconfig
      }),
      !opts.skipCompression &&
        terser({
          output: { comments: false },
          compress: { keep_infinity: true, pure_getters: true },
          warnings: true,
          toplevel: true,
          mangle: {}
        }),
      fileSize()
    ].filter(Boolean)
  }).then((bundle) => {
    return bundle.write({
      file: path.join(opts.rootPath, "dist/index.js"),
      sourcemap: true,
      format: opts.format || "esm",
      treeshake: {
        propertyReadSideEffects: false
      }
    });
  });
};
