import { GrafooQuery } from "./types";

// @ts-ignore
export function graphql<T = {}, U = {}>(strs: TemplateStringsArray): GrafooQuery<T, U> {}

export let gql = graphql;
