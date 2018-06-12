var fs = require("fs");
var path = require("path");
var rollup = require("rollup").rollup;
var terser = require("rollup-plugin-terser").terser;
var babel = require("rollup-plugin-babel");
var buble = require("rollup-plugin-buble");
var nodeResolve = require("rollup-plugin-node-resolve");
var fileSize = require("rollup-plugin-filesize");

module.exports = function build(opts) {
  var pkg = JSON.parse(fs.readFileSync(path.join(opts.rootPath, "package.json"), "utf-8"));
  var peerDependencies = pkg.peerDependencies || {};

  rollup({
    input: path.join(opts.rootPath, opts.input),
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

function resolveTSPlugin() {
  return {
    resolveId: function(importee, importer) {
      if (importer) {
        var tsImportee = path.resolve(path.dirname(importer), importee + ".ts");

        if (fs.existsSync(tsImportee)) return tsImportee;
      }

      return importee;
    }
  };
}
