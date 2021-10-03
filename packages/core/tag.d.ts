declare module "@grafoo/core/tag" {
  import { GrafooObject } from "@grafoo/core";

  export default function graphql<T = unknown, U = unknown>(
    strs: TemplateStringsArray
  ): GrafooObject<T, U>;
}
