export const shallowEqual = (a, b) => {
  for (let i in a) if (a[i] !== b[i]) return false;
  for (let i in b) if (!(i in a)) return false;
  return true;
};

export const assign = Object.assign;

export const isNotNullObject = _ => _ && typeof _ == "object";

export const getQueryIdentifier = ({ query: { query } }, variables) => {
  const vars = JSON.stringify(variables);
  return query + vars ? ":" + JSON.stringify(variables) : "";
};

export { default as buildQueryTree } from "./buildQueryTree";
export { default as mapObjects } from "./mapObjects";
export { default as mergeObjects } from "./mergeObjects";
