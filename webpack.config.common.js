const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.js',
  },
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: "[name].bundle.js",
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new CleanWebpackPlugin(),
    
    new HtmlWebpackPlugin({
      filename: 'index.html',
      inject: true,
      title: "Output management",
      template: path.resolve(__dirname, 'src', 'index.html')
    })
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /[\\/]node_modules[\\/]/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|svg|jpg|gif|wav|mp3)$/,
        loader: 'file-loader',
      },
    ]
  },
};