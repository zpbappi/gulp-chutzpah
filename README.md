# gulp-chutzpah [![Build Status](https://travis-ci.org/zpbappi/gulp-chutzpah.svg?branch=master)](https://travis-ci.org/zpbappi/gulp-chutzpah)
A gulp plugin to run javascript tests using Chutzpah test runner

## Installation

```sh
npm install gulp-chutzpah
```

## Usage

### ...with the test files

```node
var gulp = require("gulp"),
    chutzpah = require("gulp-chutzpah");

var opts = {
    executable: "/path/to/chutzpah.console.exe"
};

gulp.task("test", function(){
    gulp.src("./tests/*.js")
    .pipe(chutzpah(opts));
});
```

### ...with chutzpah settings file

```node
var gulp = require("gulp"),
    chutzpah = require("gulp-chutzpah");

var opts = {
    executable: "/path/to/chutzpah.console.exe",
    isSettingsFile: true
};

gulp.task("test", function(){
    gulp.src("/path/to/chutzpah-settings.json")
    .pipe(chutzpah(opts));
});
```

### ...with exec options (optional)
```node
var opts = {
    executable: "/path/to/chutzpah.console.exe"
    // other options
};

var execOptions = {
    encoding: 'utf8',
    timeout: 0,
    maxBuffer: 200 * 1024
    // other exec options
}

gulp.task("test", function(){
    gulp.src("/my/test/files.extention")
    .pipe(chutzpah(opts, execOptions));
});
```

## Options

The options object must have a property named `executable`, which is the location of 
your chutzpah console executable file. Usually, it is `chutzpah.console.exe`.

You can optionally supply any of the [chutzpah command line options](https://github.com/mmanela/chutzpah/wiki/command-line-options), except `path`. 

Here are the options again with their default values:

- `executable` : __Required__. "/path/to/chutzpah.console.exe".
- `isSettingsFile` : __Conditionally required__. Must set to `true` when using chutzpah settings files to specify test files and/or other settings. Detail about the json settings file can be found [here](https://github.com/mmanela/chutzpah/wiki/Chutzpah.json-Settings-File). *Important:*  when this value is set to `true`, all other settings are ignored (except of course, executable). Default is `false`. 
- `nologo` : Do not show the copyright message. Default is `false`.
- `silent` : Do not output running test count. Default is `false`.
- `teamcity` : Forces TeamCity mode (normally auto-detected). Default is `false`.
- `wait` : Wait for input after completion. Default is `false`.
- `failOnError` : Return a non-zero exit code if any script errors or timeouts occurs. Default is `false`.
- `debug` : Print debugging information and tracing to console. Default is `false`.
- `trace` : Logs tracing information to chutzpah.log. Default is `false`.
- `openInBrowser` : Launch the tests in a browser. Default is `false`. Set `true` to launch in default browser. 
You can also set it to your desired browser name like `"IE"`, `"Firefox"` or `"Chrome"`.
- `parallelism` : Max degree of parallelism for Chutzpah. Default is `false`. Set it any number you want. 
You can also set it to `true`, which will be treated as `number of CPUs + 1`. Note that, if it set to more than 1, the test output may be a bit jumbled.
- `vsoutput` : Print output in a format that the VS error list recognizes. Default is `false`.
- `coverage` : Enable coverage collection. Default is `false`.
- `showFailureReport` : Show a failure report after the test run. Usefull if you have a large number of tests. Default is `false`.
- `settingsFileEnvironment` : Sets the environment properties for a chutzpah.json settings file. Default is `""`. 
Specify more than one to add multiple environments. Example value: `"settingsFilePath;prop1=val1;prop2=val2"`.
- `junit` : output results to JUnit-style XML file. Default is `""`. Set a file path to generate the file.
- `lcov` : outputs results as LCOV data for further processing. Default is `""`. Set a file path to generate the file.
- `trx` : output results to Visual Studio Trx file. Default is `""`. Set a file path to generate the file. 
- `nunit2` : output results to NUnit-style XML file. Default is `""`. Set a file path to generate the file.
- `coveragehtml` : Outputs default Chutzpah coverage HTML. Default is `""`. Set a file path to generate the file.

## Exec Options

This is optional second parameter to `chutzpah()`. Default options can be found [here](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback).