import { GrafooQuery } from "./types";

// @ts-ignore
export function graphql<T = unknown, U = unknown>(strs: TemplateStringsArray): GrafooQuery<T, U> {}

export let gql = graphql;
