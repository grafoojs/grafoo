import { Context, MutationProps } from "./types";

export function Mutation({ render, query }: MutationProps, { client }: Context): JSX.Element {
  return render({
    mutate: variables => client.request({ query: query.query, variables }),
    client
  });
}
