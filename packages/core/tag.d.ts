declare module "@grafoo/core/tag" {
  import { GrafooObject } from "@grafoo/types";

  export default function graphql(strs: TemplateStringsArray): GrafooObject;
}
