export const shallowEqual = (a, b) => {
  for (let i in a) if (a[i] !== b[i]) return false;
  for (let i in b) if (!(i in a)) return false;
  return true;
};

export const assign = Object.assign;

export const isNotNullObject = val => val && "object" == typeof val;

export const queryID = (query, variables) =>
  query.loc.source.body.replace(/[\s,]+/g, "").trim() + JSON.stringify(variables) || "";

export { default as buildQueryTree } from "./buildQueryTree";
export { default as mapObjects } from "./mapObjects";
export { default as mergeObjects } from "./mergeObjects";
