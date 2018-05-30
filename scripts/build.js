const { readdirSync } = require("fs");
const { join } = require("path");
const { exec } = require("child_process");

const hasDependency = ["core", "preact"];
const noDependency = readdirSync(join(__dirname, "..", "packages")).filter(
  x => !hasDependency.some(y => y === x)
);

const first = exec(`lerna run --scope "@grafoo/*(${noDependency.join("|")})" prepare`);

first.stdout.pipe(process.stdout);
first.stderr.pipe(process.stderr);

first.on("close", () => {
  const second = exec(`lerna run --scope "@grafoo/*(${hasDependency.join("|")})" prepare`);

  second.stdout.pipe(process.stdout);
  second.stderr.pipe(process.stderr);
});
