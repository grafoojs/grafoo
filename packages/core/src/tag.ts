import { GrafooQuery } from "./types";

export declare function graphql<T = unknown, U = unknown>(
  strs: TemplateStringsArray
): GrafooQuery<T, U>;

export declare function gql<T = unknown, U = unknown>(
  strs: TemplateStringsArray
): GrafooQuery<T, U>;
