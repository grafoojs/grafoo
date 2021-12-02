import pkg from "./package.json";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  external: Object.keys(pkg.dependencies),
  output: [
    { format: "cjs", file: pkg.main, exports: "auto" },
    { format: "esm", file: pkg.module }
  ],
  plugins: [typescript()]
};
