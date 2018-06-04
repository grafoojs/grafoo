#!/usr/bin/env node

/* eslint-disable no-console */

const mri = require("mri");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const build = require(".");

const opts = mri(process.argv.slice(2));
const CWD = process.cwd();

(async () => {
  try {
    await exec("tsc -p tsconfig.build.json");

    await build(
      Object.assign(opts, {
        skipCompression: !!opts["skip-compression"],
        rootPath: CWD
      })
    );
  } catch (stderr) {
    console.error(stderr);
  }
})();
