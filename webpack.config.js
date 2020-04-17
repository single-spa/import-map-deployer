module.exports = {
  entry: "./src/elm/index.js",
  output: {
    path: "./src/public",
    filename: "bundle.js",
  },
  resolve: {
    modulesDirectories: ["node_modules"],
    extensions: ["", ".js", ".elm"],
  },
  module: {
    loaders: [
      {
        test: /\.elm$/,
        exclude: /node_modules/,
        loader: "elm-webpack",
      },
      {
        test: /\.js$/,
        exclude: [/elm-stuff/, /node_modules/],
        loader: "babel-loader",
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
      },
      {
        test: /\.eot$/,
        loader: "file",
      },
      {
        test: /\.svg$/,
        loader: "file",
      },
      {
        test: /\.ttf$/,
        loader: "file",
      },
      {
        test: /\.woff$/,
        loader: "file",
      },
    ],
    noParse: /\.elm$/,
  },
};
