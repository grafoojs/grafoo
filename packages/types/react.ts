import { ClientInstance } from "./core";
import { GrafooConsumerProps, GrafooRenderFn } from "./bindings";

export interface Context {
  client: ClientInstance;
}

export type GrafooPreactProviderProps = Context & { children?: [JSX.Element] };

export type GrafooReactConsumerProps = GrafooConsumerProps & { children: GrafooRenderFn };

export type GrafooPreactConsumerProps = GrafooConsumerProps & { children?: [GrafooRenderFn] };
