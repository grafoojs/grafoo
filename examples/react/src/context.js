import createGrafooContext from "@grafoo/react";
import client from "./client";

export const { Provider, Consumer } = createGrafooContext(client);
