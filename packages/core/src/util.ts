import { Variables } from "@grafoo/types";

export const idFromProps = (branch, idFields) => {
  let identifier = "";
  for (const id of idFields) branch[id] && (identifier += branch[id]);
  return identifier;
};

export const isNotNullObject = obj => obj && typeof obj == "object";

export const getPathId = (path: string, args: string[], variables?: Variables) => {
  variables = variables || {};
  let hasArgs = false;
  let finalPath = path;
  let i = args.length;

  while (i--) {
    if (args[i] in variables) {
      const v = variables[args[i]];

      if (!hasArgs) {
        finalPath += ":" + v;
      } else {
        finalPath += v;
        hasArgs = true;
      }
    }
  }

  return finalPath;
};
