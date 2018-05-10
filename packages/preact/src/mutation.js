// @flow

import { h } from "preact";
import { assign } from "@grafoo/util";

import type { ClientInstance } from "@grafoo/core";
import type { Variables } from "@grafoo/transport";

type Query = { doc: string };

type MutateFn = (variables?: Variables) => Promise<Object>;

type RenderArgs = { mutate: MutateFn, client: ClientInstance };

type Node = typeof React$Component;

type RenderFunction = (renderArgs: RenderArgs) => Node;

type Props = { children: [RenderFunction], query: Query };

type Context = { client: ClientInstance };

export function Mutation({ children, query: { doc } }: Props, { client }: Context): Node {
  return children[0]({
    mutate: variables => client.request({ query: doc, variables }),
    client
  });
}

export function withMutation({ doc }: Query) {
  return (Child: Node) => {
    const WithMutation = (ownProps: {}) =>
      h(Mutation, { query: { doc } }, props => h(Child, assign({}, ownProps, props)));

    return WithMutation;
  };
}
