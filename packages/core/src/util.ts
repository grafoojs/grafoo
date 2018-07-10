import { Variables } from "@grafoo/types";

export let idFromProps = (branch, idFields) => {
  branch = branch || {};
  let identifier = "";

  for (let i = 0; i < idFields.length; i++) {
    branch[idFields[i]] && (identifier += branch[idFields[i]]);
  }

  return identifier;
};

export let isNotNullObject = obj => obj && typeof obj == "object";

export let getPathId = (path: string, args: string[], variables?: Variables) => {
  variables = variables || {};
  let finalPath = path;
  let i = args.length;

  while (i--) finalPath += ":" + variables[args[i]];

  return finalPath;
};
