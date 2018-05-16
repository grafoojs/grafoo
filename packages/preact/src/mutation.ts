import { GrafooObject } from "@grafoo/cache";
import { Variables } from "@grafoo/transport";
import { ClientInstance } from "@grafoo/core";

export interface MutationRenderProps {
  mutate(variables?: Variables): Promise<{}>;
  client: ClientInstance;
}

export type MutationRenderFn = (props: MutationRenderProps) => JSX.Element;

export interface MutationProps {
  query: GrafooObject;
  render: MutationRenderFn;
}

export function Mutation(
  { render, query }: MutationProps,
  { client }: { ClientInstance }
): JSX.Element {
  return render({
    mutate: variables => client.request({ query: query.query, variables }),
    client
  });
}
