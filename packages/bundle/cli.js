#!/usr/bin/env node

/* eslint-disable no-console */

const mri = require("mri");
const { exec } = require("child_process");
const build = require(".");

const opts = mri(process.argv.slice(2));
const CWD = process.cwd();

const createDef = exec("tsc -p tsconfig.build.json");

createDef.stdout.pipe(console.log);
createDef.stderr.pipe(console.error);

createDef.on("close", () => {
  build(
    Object.assign(opts, {
      skipCompression: !!opts["skip-compression"],
      rootPath: CWD
    })
  ).catch(console.error);
});
