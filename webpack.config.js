module.exports = {
  entry: './src/elm/index.js',
  output: {
    path: "./src/public",
    filename: 'bundle.js'
  },
  resolve: {
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.elm']
  },
  module: {
    loaders: [
      {
        test: /\.elm$/,
        exclude: /node_modules/,
        loader: 'elm-webpack'
      },
      {
        test: /\.js$/,
        exclude: [/elm-stuff/, /node_modules/],
        loader: "babel-loader"
      }
    ],
    noParse: /\.elm$/
  },
}
