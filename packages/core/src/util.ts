import { Variables } from "@grafoo/types";

export var idFromProps = (branch, idFields) => {
  var identifier = "";

  for (var i = 0; i < idFields.length; i++) {
    branch[idFields[i]] && (identifier += branch[idFields[i]]);
  }

  return identifier;
};

export var isNotNullObject = obj => obj && typeof obj == "object";

export var getPathId = (path: string, args: string[], variables?: Variables) => {
  variables = variables || {};
  var finalPath = path;
  var i = args.length;

  while (i--) finalPath += ":" + variables[args[i]];

  return finalPath;
};
