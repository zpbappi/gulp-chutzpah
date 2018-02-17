"use strict";

var gutil = require("gulp-util"),
    through = require("through2"),
    exec = require("child_process").exec,
    shallowCopy = require("util")._extend,
    Readable = require('stream').Readable;

var defaultOpts = {
    nologo: false,
    silent: false,
    teamcity: false,
    wait: false,
    failOnError: false,
    debug: false,
    trace: false,
    openInBrowser: void (0),
    parallelism: void (0),
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

var getCombinedOpts = function (baseOpts, userSuppliedOpts) {
    if (!userSuppliedOpts)
        return baseOpts;

    for (var key in userSuppliedOpts) {
        if (isValidProperty(baseOpts, userSuppliedOpts, key)) {
            baseOpts[key] = userSuppliedOpts[key];
        }
    }

    return baseOpts;
};

var isValidProperty = function (baseOpts, userOpts, propertyName) {
    return baseOpts.hasOwnProperty(propertyName) &&
        userOpts.hasOwnProperty(propertyName) &&
        (
            typeof baseOpts[propertyName] === typeof userOpts[propertyName] ||
            typeof baseOpts[propertyName] === "undefined"
        );
};

var getCommandLineOptionArgString = function (opts, files) {
    var arg = "";
    files = files || [];

    for (var key in opts) {
        if (!opts.hasOwnProperty(key))
            continue;

        if (typeof opts[key] === "boolean")
            arg += opts[key] ? " /" + key : "";
        else if (typeof opts[key] === "string")
            arg += opts[key].length ? (" /" + key + " " + opts[key]) : "";
        else if (typeof opts[key] === "number")
            arg += " /" + key + " " + opts[key];
    }

    files.forEach(function (file) {
        arg += " /path \"" + file + "\"";
    }, this);

    return arg;
};

var getStream = function (opts, userOpts) {
    var files = [];
    return through.obj(
        function (file, encoding, callback) {
            if (!file.isNull())
                files.push(file.path);

            callback(null, file);
        },
        function (callback) {
            var args = getCommandLineOptionArgString(opts, files),
                command = userOpts.executable + args;

            execCommand(command, callback);
        }
    );
}

var getNewStream = function (opts, userOpts) {
    var stream = new Readable({ objectMode: true });
    stream._read = function () { };

    getSettingsFileCommandPromise(opts, userOpts)
        .then(function () {
            stream.emit('end');
        }, function (e) {
            var existingError = new Error(e);
            var err = new gutil.PluginError("gulp-chutzpah", existingError);

            stream.emit('error', err);
            stream.emit('end');
        });
    return stream;
}

var getSettingsFileCommandPromise = function (opts, userOpts) {
    return new Promise(function (resolve, reject) {
        var args = getCommandLineOptionArgString(opts, []),
            command = userOpts.executable + ' ' + userOpts.settingsFile + args;

        execCommand(command, resolve);
    });
}

var execCommand = function (command, callback) {
    exec(command, function (err, stdout, stderr) {
        console.log(stdout);
        console.error(stderr);
        callback(err);
    });
}

var chutzpahRunner = function (userOpts) {
    if (!userOpts || typeof userOpts["executable"] !== "string" || userOpts["executable"].length === 0) {
        throw new gutil.PluginError({
            plugin: "gulp-chutzpah",
            message: "gulp-chutzpah: path to chutzpah runner must be specified using the property named 'executable'."
        });
    }

    var opts = shallowCopy({}, defaultOpts);
    opts = getCombinedOpts(opts, userOpts);

    if (userOpts.settingsFile) {
        return getNewStream(opts, userOpts);
    }
    else {
        return getStream(opts, userOpts);
    }
};

module.exports = chutzpahRunner;
