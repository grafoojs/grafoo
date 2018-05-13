export const assign = Object.assign;

export const isNotNullObject = (_: {}): boolean => _ && typeof _ == "object";

export const shallowEqual = (a: {}, b: {}) => {
  for (const i in a) if (a[i] !== b[i]) return false;
  for (const i in b) if (!(i in a)) return false;
  return true;
};

type SortFn = (obj: { name: { value: string } }) => string;

export const sortAlphabetically = (array: any[], fn?: SortFn) => {
  fn = fn || (obj => obj.name.value);

  return (
    array &&
    array.sort((prev, next) => {
      if (fn(prev) < fn(next)) return -1;
      if (fn(prev) > fn(next)) return 1;
      return 0;
    })
  );
};
