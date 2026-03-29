const path = require("path");
const webpack = require("webpack");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { transform } = require("./scripts/transform-manifest");

const browser = process.env.BROWSER || "chrome";
const outputDir = `dist-${browser}-mv3`;

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
    path: path.resolve(__dirname, outputDir),
  },
  mode: "development",
  devServer: {
    static: {
        directory: path.join(__dirname, 'public'),
        watch: true,
    },
    compress: true,
    hot: true,
    port: 9000,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "popup.html"),
      inject: true,
      chunks: ["popup"],
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "manifest.template.json",
          to: "manifest.json",
          transform: transform(browser),
        },
        { from: "images", to: "images" },
      ],
    }),
    ...(process.env.BUNDLE_ANALYZER ? [new BundleAnalyzerPlugin()] : []),
  ],
};
