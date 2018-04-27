export declare const assign: {
  <T, U>(target: T, source: U): T & U;
  <T, U, V>(target: T, source1: U, source2: V): T & U & V;
  <T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
  (target: object, ...sources: any[]): any;
};

export declare const isNotNullObject: (_: object | null) => boolean | null;

export interface ShallowEqualParam {
  [key: string]: any;
}

export declare const shallowEqual: (a: ShallowEqualParam, b: ShallowEqualParam) => boolean;

export declare const sortAlphabetically: (array: any[], fn?: (obj: { name: any }) => any) => any[];
