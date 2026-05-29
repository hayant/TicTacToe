const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// Single-entry SPA: one bundle served from wwwroot root. The React Router app
// (src/Views/MainMenu/App.tsx) handles the login view and all /app* routes.
module.exports = {
    entry: "./src/Views/MainMenu/index.tsx",
    mode: "development",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "../wwwroot"),
        clean: true,
        publicPath: "/",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "src/Views/MainMenu/index.html",
        }),
    ],
    devServer: {
        static: path.resolve(__dirname, "../wwwroot"),
        port: 3000,
        open: true,
    },
};
