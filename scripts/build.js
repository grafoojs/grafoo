const { readdirSync } = require("fs");
const { join } = require("path");
const { exec } = require("child_process");

const pkgsRoot = join(__dirname, "..", "packages");

const withDeps = ["react", "preact"];
const noDeps = readdirSync(pkgsRoot).filter(x => !withDeps.some(y => y === x));

const command = exec(
  [
    `lerna run --scope "@grafoo/*(${noDeps.join("|")})" build`,
    `lerna run --scope "@grafoo/*(${withDeps.join("|")})" build`
  ].join(" && ")
);

command.stdout.pipe(process.stdout);
command.stderr.pipe(process.stderr);
