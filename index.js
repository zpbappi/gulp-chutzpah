"use strict";

var gutil = require('gulp-util'),
    through = require('through2'),
    exec = require('child_process').exec;

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
    settingsFileEnvironment: false,
    junit: "",
    lcov: "",
    trx: "",
    nunit2: "",
    coveragehtml: ""
};

var getCombinedOpts = function(baseOpts, userSuppliedOpts){
    if(!userSuppliedOpts)
        return baseOpts;
        
    for (var key in userSuppliedOpts) {
        if (isValidProperty(baseOpts, userSuppliedOpts, key)){
            baseOpts[key] = userSuppliedOpts[key];
        }
    }
    
    return baseOpts;
};

var isValidProperty = function(baseOpts, userOpts, propertyName){
    return  baseOpts.hasOwnProperty(propertyName) && 
            userOpts.hasOwnProperty(propertyName) &&
            (
                typeof baseOpts[propertyName] === typeof userOpts[propertyName] ||
                typeof baseOpts[propertyName] === "undefined" 
            );
};

var getCommandLineOptionArgString = function(opts, files){
    var arg = "";
    files = files || [];
    
    for (var key in opts) {
        if (!opts.hasOwnProperty(key)) 
            continue;
            
        if(typeof opts[key] === "boolean")
            arg += opts[key] ? " /" + key : "";
        else if(typeof opts[key] === "string" || typeof opts[key] === "number")
            arg += opts[key].length ? (" /" + key + " " + opts[key]) : "";                
    }
    
    files.forEach(function(file) {
        arg += " /path " + file;
    }, this);
    
    return arg;
};

var chutzpahRunner = function(userOpts){
    var files = [];
    
    if(!userOpts || typeof userOpts["executable"] !== "string" || userOpts["executable"].length === 0){
        throw new gutil.PluginError({
            plugin: "gulp-chutzpah",
            message: "gulp-chutzpah: path to chutzpah runner must be specified using the property named 'executable'."
        });
    }
    
    var opts = getCombinedOpts(defaultOpts, userOpts);
    
    return through.obj(
        function(file, encoding, callback){
            if (!file.isNull())
                files.push(file.path);
    
            callback(null, file);
        },
        function(callback){
            var args = getCommandLineOptionArgString(opts, files);
            exec(userOpts.executable + args, function(err, stdout, stderr){
                console.log(stdout);
                console.error(stderr);
                callback(err);
            });
        }
    );
};

module.exports = chutzpahRunner;