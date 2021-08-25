// prettier.config.js or .prettierrc.js
module.exports = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  overrides: [
    {
      files: '*.test.js',
      options: {
        semi: true,
      },
    },
    {
      files: '*.sol',
      options: {
        tabWidth: 4,
      },
    },
  ],
};
