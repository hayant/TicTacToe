const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const pkg = require("./package.json");

// Build identity baked into the bundle at compile time. BUILD_NUMBER / GIT_SHA are
// supplied by CI (GitHub run number + commit sha); local builds fall back to dev/local.
const buildNumber = process.env.BUILD_NUMBER || "dev";
const shortSha = (process.env.GIT_SHA || "local").slice(0, 7);
const buildTime = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
const appVersion = `v${pkg.version} · build ${buildNumber} · ${shortSha} · ${buildTime}`;

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
        new webpack.DefinePlugin({
            __APP_VERSION__: JSON.stringify(appVersion),
        }),
    ],
    devServer: {
        static: path.resolve(__dirname, "../wwwroot"),
        port: 3000,
        open: true,
    },
};
