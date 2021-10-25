import { GraphQlPayload } from "@grafoo/core";

export function createTransport(url: string, options?: RequestInit | (() => RequestInit)) {
  return async <T>(query: string, variables?: unknown): Promise<GraphQlPayload<T>> => {
    options = typeof options == "function" ? options() : options || {};

    let response = await fetch(
      url,
      Object.assign(options, {
        body: JSON.stringify({ query, variables }),
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, options.headers)
      })
    );

    return await response.json();
  };
}
