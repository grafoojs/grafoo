import createBindings from "@grafoo/bindings";
import { GrafooConsumerProps } from "@grafoo/types";
import { useContext, useState, useEffect, useRef } from "react";
import { ctx } from ".";

export default function useGrafoo<T, U>(config: GrafooConsumerProps<T, U>) {
  config = config || {};
  let { skip, query, variables } = config;
  let client = useContext(ctx);
  let { current: bindings } = useRef(
    createBindings<T, U>(client, config, () => {
      setState(bindings.getState());
    })
  );
  let [state, setState] = useState(bindings.getState());
  let { loaded } = state;

  useEffect(() => {
    if (skip || !query || loaded) return;

    bindings.load(variables);

    return () => {
      bindings.unbind();
    };
  }, [skip, query, variables, loaded]);

  return state;
}
