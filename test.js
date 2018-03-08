var gulp = require("gulp"),
    should = require("should"),
    assert = require("stream-assert"),
    intoStream = require("into-stream"),
    Q = require("q"),
    proxyquire = require("proxyquire"),
    chutzpah = require("./index.js");

var PATH_TO_CHUTZPAH = "/path/to/chutzpah.runner.exe";


function getChutzpahWithProxy(proxyObj){
    return proxyquire("./index.js", proxyObj);
};

function getCommandPromise(optionalConfigs, sourceFiles, execOptions){
    sourceFiles = sourceFiles || "index.js";
    execOptions = execOptions || {};

    var deferred = Q.defer();
    var chutzpah = getChutzpahWithProxy({"child_process": {"exec": function(command, opts){
        deferred.resolve({ command: command, opts: opts });
    }}});
    
    if(typeof optionalConfigs.executable !== "string")
        optionalConfigs.executable = PATH_TO_CHUTZPAH
    
    gulp.src(sourceFiles)
    .pipe(chutzpah(optionalConfigs, execOptions))
    .pipe(assert.end(function(){}))
    .end();
    
    return deferred.promise;
};


describe("gulp-chutzpah", function(){

    describe("when calling chutzpah()", function(){
        const pluginErrorMessage = "gulp-chutzpah: path to chutzpah runner must be specified using the property named 'executable'.";
        
        it("should throw when called without any argument", function(){
            (function(){
                chutzpah();
            }).should.throw(pluginErrorMessage);
        });
        
        it("should throw when called without `executable` path", function(){
            (function(){
                chutzpah({foo: "bar"}); 
            }).should.throw(pluginErrorMessage);
        });
        
        it("should not throw when `executable` is specified", function(){
            (function(){
                chutzpah({executable: PATH_TO_CHUTZPAH})
            }).should.not.throw();
        });
    });
    
    describe("when handling content", function(){
        
        var pluginStream = null;
        
        beforeEach(function(){
            var chutzpah = getChutzpahWithProxy({ "child_process": {"exec": function() {} } });
            pluginStream = chutzpah({
                "executable": PATH_TO_CHUTZPAH
            });
        });
        
        it("should ignore null files", function(done){
            pluginStream
            .pipe(assert.length(0))
            .pipe(assert.end(done))
            .end();
        });
        
        it("should not throw on stream contents", function(done){
            var stream = gulp.src("*.js", {buffer: false});
            (function(){
                stream
                .pipe(pluginStream)
                .pipe(assert.end(done))
                .end();
            }).should.not.throw();
        });
        
        it("should not throw on buffered contents", function(done){
            var stream = gulp.src("*.js", {buffer: true});
            (function(){
                stream
                .pipe(pluginStream)
                .pipe(assert.end(done))
                .end();
            }).should.not.throw();
        });
        
        it("should not add any content", function(done){
            intoStream(["lorem", "ipsum"])
            .pipe(pluginStream)
            .pipe(assert.length(2))
            .pipe(assert.end(done))
            .end();
        });
        
        it("should not modify any content", function(done){
            
            function shouldBe(expected){
                return function(actual){
                    actual.should.equal(expected);
                };
            };
            
            intoStream.obj(["lorem", "ipsum", "dolor", 42])
            .pipe(pluginStream)
            .pipe(assert.first(shouldBe("lorem")))
            .pipe(assert.second(shouldBe("ipsum")))
            .pipe(assert.nth(2, shouldBe("dolor")))
            .pipe(assert.last(shouldBe(42)))
            .pipe(assert.end(done))
            .end();
        });
    });
    
    describe("when considering chutzpah configuration", function(){
        
        it("should ignore unknown parameters", function(){
            return getCommandPromise({
                "who-am-i": "dont-know"
            }).then(function (data) {
                data.command.should.not.containEql("who-am-i");
            });
        });
        
        it("should work with boolean parameters", function(){
            return getCommandPromise({
                "silent": true
            }).then(function (data) {
                data.command.should.containEql(" /silent");
            });
        });
        
        it("should work with optional value parameters without any specific value", function(){
            return getCommandPromise({
                "openInBrowser": true
            }).then(function (data) {
                data.command.should.containEql(" /openInBrowser");
            });
        });
        
        it("should work with optional value parameters with specific value", function(){
            return getCommandPromise({
                "openInBrowser": "Chrome"
            }).then(function (data) {
                data.command.should.containEql(" /openInBrowser Chrome");
            });
        });
        
        it("should work with different types of parameters together", function(){
            return getCommandPromise({
                "parallelism": 4,
                "openInBrowser": true,
                "coverage": true,
                "coveragehtml": "/path/to/coverage.html" 
            }).then(function (data) {
                data.command.should.containEql(" /parallelism 4")
                    .and.containEql(" /openInBrowser")
                    .and.containEql(" /coverage")
                    .and.containEql(" /coveragehtml /path/to/coverage.html");
            });
        });
    });

    describe("when using chutzpah with settings file", function() {
        it("should generate proper command", function() {
            return getCommandPromise({
                isSettingsFile: true
            }, "package.json")
            .then(function (data) {
                data.command.should.containEql(PATH_TO_CHUTZPAH)
                    .and.containEql("package.json");
            });
        });

        it("should ignore all other settings", function() {
            return getCommandPromise({
                isSettingsFile: true,
                "parallelism": 4,
                "openInBrowser": true
            }, "package.json")
            .then(function (data) {
                data.command.should.not.containEql("/parallelism")
                    .and.not.containEql("/openInBrowser");
            });
        });
    });

    describe("when using chutzpah with child_process.exec options", function () {

        var optionalConfigDummy = {},
            execOptionsEmptyStub = {};

        it("should call child_process.exec with specified options", function () {
            var maxBufferDummy = 10000 * 1024,
                execOptionsWithMaxBufferStub = {
                    maxBuffer: maxBufferDummy
                };
            return getCommandPromise(optionalConfigDummy, "package.json", execOptionsWithMaxBufferStub)
                .then(function (data) {
                    data.opts.should.containEql(execOptionsWithMaxBufferStub);
                });
        });

        it("should ignore undefined options", function () {
            return getCommandPromise(optionalConfigDummy, "package.json")
                .then(function (data) {
                    data.opts.should.containEql(execOptionsEmptyStub);
                });
        });

        it("should ignore null options", function () {
            return getCommandPromise(optionalConfigDummy, "package.json", null)
                .then(function (data) {
                    data.opts.should.containEql(execOptionsEmptyStub);
                });
        });

    });
});