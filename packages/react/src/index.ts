import * as React from "react";
import createBindings, { GrafooConsumerProps } from "@grafoo/bindings";
import { GrafooClient, GrafooObject } from "@grafoo/core";

// @ts-ignore
export let GrafooContext = React.createContext<GrafooClient>({});

type GrafooProviderProps = {
  client: GrafooClient;
};

export let GrafooProvider: React.FC<GrafooProviderProps> = (props) =>
  React.createElement(GrafooContext.Provider, { value: props.client }, props.children);

export function useGrafoo<T extends GrafooObject, U extends Record<string, GrafooObject>>(
  props: GrafooConsumerProps<T, U>
) {
  let client = React.useContext(GrafooContext);
  let update = React.useCallback(() => setState(bindings.getState()), []);
  let bindings = React.useMemo(() => createBindings(client, update, props), []);
  let [state, setState] = React.useState(() => bindings.getState());
  let variables = React.useRef(props.variables);

  React.useEffect(() => {
    if (!props.skip && props.query && !state.loaded) {
      bindings.load();
    }

    return () => {
      bindings.unbind();
    };
  }, []);

  React.useEffect(() => {
    if (
      (!props.skip && props.query && !state.loaded) ||
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
