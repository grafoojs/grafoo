export let idFromBranch = (branch: Record<string, string>, idFields: string[]): string => {
  branch = branch || {};
  let identifier = "";

  for (let i = 0; i < idFields.length; i++) {
    branch[idFields[i]] && (identifier += branch[idFields[i]]);
  }

  return identifier;
};

export let isNotNullObject = (obj: any): boolean => typeof obj === "object" && obj;

export let getPathId = (path: string, args: string[], variables?: unknown): string => {
  variables = variables || {};
  let finalPath = path;
  let i = args.length;

  while (i--) finalPath += ":" + variables[args[i]];

  return finalPath;
};
