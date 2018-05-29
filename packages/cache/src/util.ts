export const idFromProps = (branch, idFields) => {
  let identifier = "";
  for (const id of idFields) branch[id] && (identifier += branch[id]);
  return identifier;
};

export const isNotNullObject = obj => obj && typeof obj == "object";
