#!/usr/bin/env node

/* eslint-disable no-console */

var mri = require("mri");
var promisify = require("util.promisify");
var exec = promisify(require("child_process").exec);
var build = require(".");

var opts = mri(process.argv.slice(2));

opts.skipCompression = !!opts["skip-compression"];
opts.rootPath = process.cwd();

exec("tsc")
  .then(function() {
    return build(opts);
  })
  .catch(console.error);
