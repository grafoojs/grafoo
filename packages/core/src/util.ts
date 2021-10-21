import { GrafooPath, GrafooQuery, GrafooSelection } from "./types";

export let idFromBranch = <T>(branch: T, idFields: string[]) =>
  branch
    ? idFields
        .map((i) => branch[i])
        .filter(Boolean)
        .join(":")
    : "";

export function getPathId<T extends GrafooQuery>(
  path: string,
  args: Record<string, string> = {},
  variables: T["_variablesType"]
) {
  variables = variables || {};
  args = args || {};

  let ids = Object.entries(args).map(([name, value]) => {
    let rgx = /^\$(?<variable>\w+)/i;
    let { variable } = rgx.exec(value)?.groups ?? {};
    let finalValue = variable ? variables[variable] : value;

    return `${name}:${finalValue}`;
  });

  return [path].concat(ids).join(":");
}

export function resolveSelection(
  selection: GrafooSelection = {},
  fragments: GrafooSelection
): GrafooSelection {
  let newArgs = selection.args ?? {};
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

export function getPathType(path: GrafooPath) {
  return path ? (Array.isArray(path) ? [] : {}) : null;
}
