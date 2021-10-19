import { GrafooSelection } from ".";

export let idFromBranch = <T>(branch: T, idFields: string[]) =>
  branch
    ? idFields
        .map((i) => branch[i])
        .filter(Boolean)
        .join(":")
    : "";

export let isNotNullObject = (obj: unknown) => obj && typeof obj === "object";

export function getPathId(path: string, args: string[], variables?: unknown) {
  variables = variables || {};
  args = args || [];

  return [path]
    .concat(
      args
        .map(
          (a) => `${a}:${variables[a] === "object" ? JSON.stringify(variables[a]) : variables[a]}`
        )
        .filter(Boolean)
    )
    .join(":");
}

export function resolveSelection(
  selection: GrafooSelection,
  fragments: GrafooSelection
): GrafooSelection {
  let newArgs = selection.args ?? [];
  let newScalars = selection.scalars ?? [];
  let newSelection = selection.select ?? {};
  let newFragments = [];

  if (selection.fragments) {
    for (let f of selection.fragments) {
      let fragment = fragments.select[f];
      newScalars = [...newScalars, ...(fragment.scalars ?? [])];
      newFragments = [...newFragments, ...(fragment.fragments ?? [])];
      newSelection = { ...newSelection, ...fragment.select };
    }
  }

  return {
    args: newArgs,
    select: newSelection,
    scalars: [...new Set(newScalars)],
    fragments: [...new Set(newFragments)]
  };
}
