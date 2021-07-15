const path = require("path");
const webpack = require("webpack");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  module: {
    rules: [
      {
        include: [path.resolve(__dirname, "src")],
        loader: "babel-loader",
        test: /\.js$/,
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
          },
        ],
      },
    ],
  },
  entry: {
    background: "./src/background.ts",
    popup: "./src/popup.tsx",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".json"],
  },
  output: {
    filename: "[name].js",
    publicPath: "/",
  },
  mode: "development",
  devServer: {
    contentBase: path.join(__dirname, "public"),
    compress: true,
    watchContentBase: true,
    hot: true,
    port: 9000,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "popup.html"),
      inject: true,
      chunks: ["popup"],
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "." },
        { from: "images", to: "images" },
      ],
    }),
    ...(process.env.BUNDLE_ANALYZER ? [new BundleAnalyzerPlugin()] : []),
  ],
};
