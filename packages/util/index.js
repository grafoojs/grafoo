export const assign = Object.assign;

export const isNotNullObject = _ => _ && typeof _ == "object";

export const shallowEqual = (a, b) => {
  for (let i in a) if (a[i] !== b[i]) return false;
  for (let i in b) if (!(i in a)) return false;
  return true;
};

export const sortAlphabetically = (array, fn = _ => _.name.value) =>
  array &&
  array.sort((prev, next) => {
    if (fn(prev) < fn(next)) return -1;
    if (fn(prev) > fn(next)) return 1;
    return 0;
  });
