export interface GrafooObject {
  paths: { root: string; args: string[] };
  query: string;
}

export default function graphql(strs: string[]): GrafooObject {
  throw new Error(
    "@grafoo/core: if you are getting this error it means your queries arn not being transpiled"
  );
}
