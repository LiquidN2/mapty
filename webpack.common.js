const path = require('path');

module.exports = {
  entry: {
    script: path.resolve(__dirname, 'src/js/script.js'),
  },

  output: {
    filename: './js/[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    // clean: true,
    publicPath: '/', //Load static assets
  },
};
