const { promisify } = require("util");
const path = require("path");

const exec = promisify(require("child_process").exec);
const read = promisify(require("fs").readFile);
const write = promisify(require("fs").writeFile);

(async () => {
  let stdout;
  try {
    ({ stdout } = await exec("tsc -p tsconfig.build.json && microbundle"));
    process.stdout.write(stdout);

    const input = await read(
      path.join(__dirname, "temp", "transport", "src", "index.d.ts"),
      "utf-8"
    );

    await write(path.join(__dirname, "dist", "index.d.ts"), input, "utf-8");
    await exec("rimraf temp");
  } catch (err) {
    process.stderr.write(err);
  }
})();
