const { promisify } = require("util");
const { readdirSync } = require("fs");
const { join } = require("path");
const exec = promisify(require("child_process").exec);

const runSync = ["util", "transport", "cache", "core", "babel-plugin-tag", "bindings"];
const runAsync = readdirSync(join(__dirname, "..", "packages")).filter(
  a => !runSync.some(s => s === a)
);

(async () => {
  let stdout;
  try {
    for (const pkg of runSync) {
      ({ stdout } = await exec(`lerna run --scope @grafoo/${pkg} prepare`));
      process.stdout.write(`compiled ${pkg}:\n\n`.toUpperCase() + stdout + "\n");
    }

    ({ stdout } = await exec(`lerna run --scope "@grafoo/*(${runAsync.join("|")})" prepare`));
    process.stdout.write(`compiled ${runAsync.join(", ")}:\n\n`.toUpperCase() + stdout);
  } catch (stderr) {
    process.stderr.write(stderr);
  }
})();
