/* eslint-disable no-console */

const { promisify } = require("util");
const { readdirSync } = require("fs");
const { join } = require("path");
const exec = promisify(require("child_process").exec);

const toBuildSync = ["util", "transport", "cache", "core"];
const toBuildAsync = readdirSync(join(__dirname, "..", "packages")).filter(
  a => !toBuildSync.some(s => s === a)
);

(async () => {
  let stdout;
  try {
    for (const pkg of toBuildSync) {
      ({ stdout } = await exec(`lerna run --scope @grafoo/${pkg} prepare`));
      process.stdout.write(stdout + "\n");
    }

    ({ stdout } = await exec(`lerna run --scope "@grafoo/*(${toBuildAsync.join("|")})" prepare`));
    process.stdout.write(stdout);
  } catch (stderr) {
    process.stderr.write(stderr);
  }
})();
