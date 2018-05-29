import createClient from "@grafoo/core";

const API_URL = "https://api.graph.cool/simple/v1/cj28ccc28umr50115gjodwzix";

const client = createClient(API_URL, { idFromProps: ["id"] });

if (process.env.NODE_ENV !== "production") window.client = client;

export default client;
