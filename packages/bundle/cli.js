#!/usr/bin/env node

const mri = require("mri");
const { exec } = require("child_process");
const build = require(".");

const opts = mri(process.argv.slice(2));
const CWD = process.cwd();

try {
  const createDef = exec("tsc -p tsconfig.build.json");

  createDef.stdout.pipe(process.stdout);
  createDef.stderr.pipe(process.stderr);

  createDef.on("close", () => {
    build(
      Object.assign(opts, {
        skipCompression: opts["skip-compression"],
        rootPath: CWD
      })
    );
  });
} catch (error) {
  process.stderr.write(error);
}
