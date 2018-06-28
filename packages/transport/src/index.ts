import { GraphQlPayload, GrafooTransport, Variables } from "@grafoo/types";

export default function createTransport(
  uri: string,
  options?: RequestInit | (() => RequestInit)
): GrafooTransport {
  return <T>(query: string, variables?: Variables): Promise<GraphQlPayload<T>> => {
    options = typeof options == "function" ? options() : options || {};

    return fetch(
      uri,
      Object.assign(options, {
        body: JSON.stringify({ query, variables }),
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, options.headers)
      })
    ).then(response => response.json());
  };
}
