let { resolve } = require("resolve.exports");

module.exports = (request, options) =>
  options.defaultResolver(request, {
    ...options,
    packageFilter: (package) => {
      try {
        return {
          ...package,
          main: package.main || resolve(package, ".")
        };
      } catch (e) {
        return package;
      }
    }
  });
