let { resolve } = require("resolve.exports");

module.exports = (request, options) =>
  options.defaultResolver(request, {
    ...options,
    packageFilter: (package) => ({
      ...package,
      main: package.main || resolve(package, ".")
    })
  });
