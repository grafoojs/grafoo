var fs = require("fs");
var path = require("path");
var rollup = require("rollup").rollup;
var terser = require("rollup-plugin-terser").terser;
var typescript = require("rollup-plugin-typescript2");
var buble = require("rollup-plugin-buble");
var nodeResolve = require("rollup-plugin-node-resolve");
var fileSize = require("rollup-plugin-filesize");

module.exports = function build(opts) {
  var pkg = JSON.parse(fs.readFileSync(path.join(opts.rootPath, "package.json"), "utf-8"));
  var tsconfig = JSON.parse(fs.readFileSync(path.join(opts.rootPath, "tsconfig.json"), "utf-8"));
  var peerDependencies = pkg.peerDependencies || {};

  tsconfig.compilerOptions.target = "esnext";
  tsconfig.compilerOptions.module = "esnext";
  tsconfig.compilerOptions.declaration = true;
  tsconfig.compilerOptions.outDir = path.join(opts.rootPath, "dist");

  return rollup({
    input: path.join(opts.rootPath, opts.input),
    external: Object.keys(peerDependencies),
    plugins: [
      nodeResolve(),
      typescript({
        typescript: require("typescript"),
        tsconfigOverride: tsconfig
      }),
      buble({
        transforms: {
          dangerousForOf: true,
          dangerousTaggedTemplateString: true
        }
      }),
      !opts.skipCompress &&
        terser({
          sourceMap: true,
          output: { comments: false },
          compress: { keep_infinity: true, pure_getters: true },
          warnings: true,
          toplevel: true,
          mangle: {}
        }),
      fileSize()
    ].filter(Boolean)
  }).then(function(bundle) {
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
