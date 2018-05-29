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
