import { Variables } from "@grafoo/types";

export let idFromProps = (branch, idFields) => {
  let identifier = "";
  for (let id of idFields) branch[id] && (identifier += branch[id]);
  return identifier;
};

export let isNotNullObject = obj => obj && typeof obj == "object";

export let getPathId = (path: string, args: string[], variables?: Variables) => {
  variables = variables || {};
  let hasArgs = false;
  let finalPath = path;
  let i = args.length;

  while (i--) {
    if (args[i] in variables) {
      let v = variables[args[i]];

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
