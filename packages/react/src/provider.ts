import { createContext } from "react";
import createBindings from "@grafoo/bindings";

const { Provider, Consumer } = createContext(createBindings);
