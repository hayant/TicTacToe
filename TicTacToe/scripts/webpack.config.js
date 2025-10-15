const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = [
    {
        entry: "./src/Main/index.tsx",
        mode: "development",
        output: {
            filename: "bundle.js",
            path: path.resolve(__dirname, "../wwwroot/app"),
            clean: true,
            publicPath: "/app"
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
        },
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
                template: "src/Main/index.html",
            }),
        ],
        devServer: {
            static: "./dist",
            port: 3000,
            open: true,
        },
    },
    {
        entry: "./src/Login/index.tsx",
        mode: "development",
        output: {
            filename: "bundle.js",
            path: path.resolve(__dirname, "../wwwroot/login"),
            clean: true,
            publicPath: "/login"
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
        },
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
                template: "src/Login/index.html",
            }),
        ],
        devServer: {
            static: "./dist",
            port: 3000,
            open: true,
        },
    }
];
