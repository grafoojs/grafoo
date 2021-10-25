declare module "@grafoo/core/tag" {
  import { GrafooQuery } from "@grafoo/core";

  export default function graphql<T = unknown, U = unknown>(
    strs: TemplateStringsArray
  ): GrafooQuery<T, U>;
}
