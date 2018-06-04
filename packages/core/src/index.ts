import createCache from "@grafoo/cache";
import createTransport from "@grafoo/transport";
import { ClientInstance, ClientOptions, GrafooObject, Variables } from "@grafoo/types";

export default function createClient(uri: string, options?: ClientOptions): ClientInstance {
  const transportRequest = createTransport(uri, options && options.headers);
  const request = <T>({ query, frags }: GrafooObject, variables?: Variables) => {
    if (frags) for (const frag in frags) query += frags[frag];

    return transportRequest<T>(query, variables);
  };

  return Object.assign({}, createCache(options), { request });
}
