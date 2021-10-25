#!/usr/bin/env node

var mri = require("mri");
var build = require(".");

var opts = mri(process.argv.slice(2));

opts.skipCompression = !!opts["skip-compression"];
opts.rootPath = process.cwd();

build(opts).catch(console.error);
