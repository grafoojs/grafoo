import { VNode } from "preact";
import { GrafooObject } from "@grafoo/cache";
import { Variables } from "@grafoo/transport";
import { ClientInstance } from "@grafoo/core";
import { Context } from ".";

export interface RenderProps {
  mutate(variables?: Variables): Promise<{}>;
  client: ClientInstance;
}

export type MutationRenderFn = (props: RenderProps) => VNode<any>;

export interface MutationProps {
  query: GrafooObject;
  children: [MutationRenderFn];
}

export function Mutation({ children, query }: MutationProps, { client }: Context): VNode<any> {
  return children[0]({
    mutate: variables => client.request({ query: query.query, variables }),
    client
  });
}
