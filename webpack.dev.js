const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',

  devtool: 'inline-source-map',

  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    compress: true,
    // port: 9000,
    watchContentBase: true,
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/views/index.pug'),
      filename: 'index.html',
      inject: 'head',
      scriptLoading: 'defer',
    }),
  ],

  module: {
    rules: [
      // Load Pug template to JS
      { test: /\.pug$/, loader: 'pug-loader' },

      // Load CSS, SASS, SCSS
      {
        test: /\.s?css$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',

          // Translates CSS into CommonJS
          {
            loader: 'css-loader',
            options: { sourceMap: true },
          },

          // Add PostCSS Autoprefixer
          'postcss-loader',

          // Compiles Sass to CSS
          {
            loader: 'sass-loader',
            options: { sourceMap: true },
          },
        ],
      },
    ],
  },
});
