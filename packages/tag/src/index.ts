export interface GrafooObject {
  frags?: {
    [key: string]: string;
  };
  paths?: {
    [key: string]: {
      name: string;
      args: string[];
    };
  };
  query: string;
}

export default function graphql(strs: string[]): GrafooObject {
  throw new Error(
    "@grafoo/tag: if you are getting this error it means your queries are not being transpiled"
  );
}
