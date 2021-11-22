import * as React from "react";
import { GrafooClient, GrafooQuery } from "@grafoo/core";
import createBindings, {
  GrafooConsumerProps,
  GrafooBoundState,
  makeGrafooConfig
} from "@grafoo/bindings";

// @ts-ignore
export let GrafooContext = React.createContext<GrafooClient>({});

export type GrafooProviderProps = {
  client: GrafooClient;
};

export let GrafooProvider: React.FC<GrafooProviderProps> = (props) =>
  React.createElement(GrafooContext.Provider, { value: props.client }, props.children);

export { makeGrafooConfig };

export function useGrafoo<T extends GrafooQuery, U extends Record<string, GrafooQuery>>(
  props: GrafooConsumerProps<T, U>
): GrafooBoundState<T, U> {
  let client = React.useContext(GrafooContext);
  let update: (s: GrafooBoundState<T, U>) => void = React.useCallback((s) => setState(s), []);
  let bindings = React.useMemo(() => createBindings(client, update, props), []);
  let [state, setState] = React.useState(() => bindings.getState());
  let variables = React.useRef(props.variables);

  React.useEffect(() => {
    if (state.loading) bindings.load();
    return () => bindings.unbind();
  }, []);

  React.useEffect(() => {
    if (
      (props.query && !props.skip && !state.loaded && !state.loading) ||
      !deepEqual(variables.current, props.variables)
    ) {
      variables.current = props.variables;
      bindings.load(props.variables);
    }
  }, [props.skip, props.variables]);

  return state;
}

let deepEqual = (x: any, y: any) => {
  if (x === y) return true;

  if (isPrimitive(x) && isPrimitive(y)) return x === y;

  if (Object.keys(x).length !== Object.keys(y).length) return false;

  for (let i in x) {
    if (!(i in y) || !deepEqual(x[i], y[i])) return false;
  }

  return true;
};

let isPrimitive = (obj: any) => obj !== Object(obj);
