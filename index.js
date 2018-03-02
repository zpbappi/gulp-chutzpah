"use strict";

var gutil = require("gulp-util"),
  through = require("through2"),
  exec = require("child_process").exec,
  shallowCopy = require("util")._extend;

var defaultOpts = {
  nologo: false,
  silent: false,
  teamcity: false,
  wait: false,
  failOnError: false,
  debug: false,
  trace: false,
  openInBrowser: void(0),
  parallelism: void(0),
  vsoutput: false,
  coverage: false,
  showFailureReport: false,
  settingsFileEnvironment: "",
  junit: "",
  lcov: "",
  trx: "",
  nunit2: "",
  coveragehtml: ""
};

var getCombinedOpts = function(baseOpts, userSuppliedOpts) {
  if (!userSuppliedOpts) {
    return baseOpts;
  }

  for (var key in userSuppliedOpts) {
    if (isValidProperty(baseOpts, userSuppliedOpts, key)) {
      baseOpts[key] = userSuppliedOpts[key];
    }
  }

  return baseOpts;
};

var isValidProperty = function(baseOpts, userOpts, propertyName) {
  return (
    baseOpts.hasOwnProperty(propertyName) &&
    userOpts.hasOwnProperty(propertyName) &&
    (typeof baseOpts[propertyName] === typeof userOpts[propertyName] ||
      typeof baseOpts[propertyName] === "undefined")
  );
};

var getCommandLineOptionArgString = function(opts, files, isSettingsFile) {
  var arg = "";
  files = files || [];

  if(isSettingsFile) {
    validateSettingsFile(files);
    return ' ' + files[0];
  }

  for (var key in opts) {
    if (!opts.hasOwnProperty(key))
      continue;

    if (typeof opts[key] === "boolean")
      arg += opts[key] ? " /" + key : "";
    else if (typeof opts[key] === "string")
      arg += opts[key].length ? " /" + key + " " + opts[key] : "";
    else if (typeof opts[key] === "number")
      arg += " /" + key + " " + opts[key];
  }
  
  files.forEach(function(file) {
    arg += ' /path "' + file + '"';
  });

  return arg;
};

var validateSettingsFile = function(files) {
  if (files.length !== 1 || !files[0].endsWith(".json")) {
    throw new gutil.PluginError({
      plugin: "gulp-chutzpah",
      message:
        "gulp-chutzpah: invalid chutzpah.json settings file specified in the source stream."
    });
  }
};

var getExecOptions = function (userOpts) {
    return userOpts.execOptions || {};
}

var chutzpahRunner = function(userOpts) {
  if (
    !userOpts ||
    typeof userOpts["executable"] !== "string" ||
    userOpts["executable"].length === 0
  ) {
    throw new gutil.PluginError({
      plugin: "gulp-chutzpah",
      message:
        "gulp-chutzpah: path to chutzpah runner must be specified using the property named 'executable'."
    });
  }

  var files = [];
  var opts = shallowCopy({}, defaultOpts);
  opts = getCombinedOpts(opts, userOpts);

  return through.obj(
    function(file, encoding, callback) {
      if (!file.isNull()) {
        files.push(file.path);
      }

      callback(null, file);
    },
    function(callback) {
      var args = getCommandLineOptionArgString(
        opts,
        files,
        userOpts.isSettingsFile
      );
      exec(userOpts.executable + args, getExecOptions(userOpts), function(err, stdout, stderr) {
        console.log(stdout);
        console.error(stderr);
        callback(err);
      });
    }
  );
};

module.exports = chutzpahRunner;
