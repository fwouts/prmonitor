const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  module: {
    rules: [
      {
        include: [path.resolve(__dirname, "src")],
        loader: "babel-loader",
        test: /\.js$/
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.(scss|css)$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          },
          {
            loader: "sass-loader"
          }
        ]
      }
    ]
  },
  entry: {
    background: "./src/background.ts",
    popup: "./src/popup.tsx"
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  output: {
    filename: "[name].js",
    publicPath: "/"
  },
  mode: "development",
  devServer: {
    contentBase: path.join(__dirname, "public"),
    compress: true,
    watchContentBase: true,
    hot: true,
    port: 9000
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "popup.html"),
      inject: true,
      chunks: ["popup"]
    }),
    new CopyPlugin([
      { from: "manifest.json", to: "." },
      { from: "images", to: "." }
    ])
  ],
  optimization: {
    minimizer: [new TerserPlugin()]
  }
};
