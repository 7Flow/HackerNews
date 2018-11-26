const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const AfterCompilePlugin = require('./AfterCompilePlugin');

module.exports = {
    entry: './src/index.ts',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.worker\.ts$/,
                loader: 'worker-loader'
            },
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        modules: [path.resolve('./src'), path.resolve('./node_modules')],
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        filename: '[name][chunkhash].js',
        path: path.resolve(__dirname, '..', 'dist'),
        publicPath: '/'
    },
    plugins: [
        new HtmlWebpackPlugin({ template: 'src/index.html' }),
        new AfterCompilePlugin(),
        new webpack.LoaderOptionsPlugin({
            options: {
                worker: {
                    output: {
                        filename: "hash.worker.js",
                        chunkFilename: "[id].hash.worker.js"
                    }
                }
            }
        })
    ],
    optimization: {
        occurrenceOrder: true // To keep filename consistent between different modes (for example building only)
    }
};
