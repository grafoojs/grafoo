let { exec } = require("child_process");

let commands = ["core", "bindings", "react", "test-utils", "compiler", "babel-plugin"].map(
  (p) => `lerna run --scope @grafoo/${p} build`
);

let command = exec(commands.join(" && "));

command.stdout.pipe(process.stdout);
command.stderr.pipe(process.stderr);
