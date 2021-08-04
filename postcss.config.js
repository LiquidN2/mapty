module.exports = {
  plugins: [
    [
      'postcss-preset-env',
      {
        // Options
        browsers: ['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead'],
        autoprefixer: { flexbox: 'no 2009' },
      },
    ],
  ],
};
