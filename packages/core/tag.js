module.exports = function() {
  throw new Error(
    [
      "@grafoo/core: if you are getting this error it means that your",
      "`graphql` or `gql` tagged template literals were not transpiled."
    ].join(" ")
  );
};
