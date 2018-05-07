const path = require('path');
const SVGO = require('svgo');
const webpack = require('webpack');
const HtmlPlugin = require('html-webpack-plugin');
const UglifyPlugin = require('uglifyjs-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const htmlConfig = new HtmlPlugin({
  template: 'index.html',
  filename: 'index.html',
  inject: 'body',
});

const copyConfig = new CopyPlugin([{
  context: 'assets',
  from: '**/*.!(svg)',
  to: 'assets',
}]);

const svgo = new SVGO();
const svgCopyConfig = new CopyPlugin([{
  context: 'src/frontend/assets',
  from: '**/*.svg',
  to: 'assets',
  transform: (content, path) => {
    return svgo.optimize(content, {path});
  },
}]);

const env = new webpack.EnvironmentPlugin({ NODE_ENV: 'development' });

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  context: path.resolve(__dirname, 'src', 'frontend'),
  entry: './index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist', 'public'),
    filename: 'bundle.js',
    publicPath: '/assets',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: [{
          loader: "style-loader"
        }, {
          loader: "css-loader"
        }, {
          loader: "sass-loader"
        }]
      }
    ]
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.scss']
  },

  plugins: [
    htmlConfig,
    svgCopyConfig,
    copyConfig,
    env,
  ],

  devtool: process.env.NODE_ENV === 'production' ? 'none' : 'cheap-module-source-map',

  watchOptions: {
    ignored: /node_modules|dist/
  }
};

if (process.env.NODE_ENV === 'production') {
  module.exports.plugins.push(new UglifyPlugin());
}
