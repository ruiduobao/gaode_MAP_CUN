
module.exports = {

    mode: 'development',
    devtool: 'source-map',

    entry: __dirname+'/src/index.js',
    output: {
        path: __dirname + '/dist/',
        filename: 'index.js',
        library: 'dbf.js',
        libraryTarget: 'umd',
        globalObject: `(typeof self !== 'undefined' ? self : this)`
    },
    externals: ['fs', 'lodash', 'iconv-lite', 'debug']

};