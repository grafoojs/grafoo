import { assign } from "@grafoo/util";

export default function createTransport(uri, fetchOptions = {}) {
  return {
    request(request) {
      const init = typeof fetchOptions === "function" ? fetchOptions() : fetchOptions;

      const options = assign({ body: JSON.stringify(request) }, init, {
        method: "POST",
        headers: assign(init.headers || {}, { "Content-Type": "application/json" })
      });

      return fetch(uri, options)
        .then(res => res.json())
        .then(({ data }) => data);
    }
  };
}
