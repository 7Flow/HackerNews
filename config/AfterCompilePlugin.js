class AfterCompilePlugin {
    apply(compiler) {
        compiler.plugin('after-emit', (compilation, cb) => {
            console.log('\n - - - - - - app is running on localhost:7777 - - - - - -');
            cb();
        })
    }
}

module.exports = AfterCompilePlugin;