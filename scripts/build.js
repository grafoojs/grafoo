let { readdirSync } = require("fs");
let { join } = require("path");
let { exec } = require("child_process");

let pkgsRoot = join(__dirname, "..", "packages");

let withDeps = ["react", "preact"];
let noDeps = readdirSync(pkgsRoot).filter((x) => !withDeps.some((y) => y === x));

let command = exec(
  [
    `lerna run --scope "@grafoo/*(${noDeps.join("|")})" build`,
    `lerna run --scope "@grafoo/*(${withDeps.join("|")})" build`,
  ].join(" && ")
);

command.stdout.pipe(process.stdout);
command.stderr.pipe(process.stderr);
