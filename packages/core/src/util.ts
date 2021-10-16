export let idFromBranch = <T>(branch: T, idFields: string[]) =>
  branch
    ? idFields
        .map((i) => branch[i])
        .filter(Boolean)
        .join(":")
    : "";

export let isNotNullObject = (obj: unknown) => obj && typeof obj === "object";

export let getPathId = (path: string, args: string[], variables?: unknown) => {
  variables = variables || {};
  args = args || [];

  return (
    path +
    args
      .map((a) => `${a}:${JSON.stringify(variables[a])}`)
      .filter(Boolean)
      .join(":")
  );
};
