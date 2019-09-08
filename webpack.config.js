const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const devMode = process.env.NODE_ENV !== "production";
console.log(process.env.NODE_ENV);

const splitChunks = {
    cacheGroups: {
        vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            filename: "[name].bundle.js",
            chunks: "all"
        }
    }
};
module.exports = {
    entry: "./src/index.js",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].[hash].boundle.js"
    },
    devServer: {
        contentBase: "./dist"
    },
    resolve: {
        alias: {}
    },
    optimization: {
        splitChunks: devMode ? {} : splitChunks
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "@babel/preset-env",
                        ]
                    }
                },
            },
            {
                test: /\.css$/i,
                use: [
                    devMode ? "style-loader" : MiniCssExtractPlugin.loader,
                    "css-loader",
                    "postcss-loader"
                ],
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 8192,
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.ProvidePlugin({
            $: "jquery",
            key: "keymaster"
        }),
        new MiniCssExtractPlugin({
            filename: devMode ? "[name].css" : "[name].[hash].css"
        }),
        new HtmlWebpackPlugin({
            title: "Development",
            template: "src/index.html"
        })
    ]
};