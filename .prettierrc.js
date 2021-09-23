// prettier.config.js or .prettierrc.js
module.exports = {
  overrides: [
    {
      files: "*.test.js",
      options: {
        semi: true,
        tabWidth: 2,
        singleQuote: true,
      },
    },
    {
      files: "*.sol",
      options: {
        printWidth: 80,
        tabWidth: 4,
        useTabs: false,
        singleQuote: false,
        bracketSpacing: false,
        explicitTypes: "always",
      },
    },
    {
      files: "*.md",
      options: {
        proseWrap: "preserve",
      },
    },
  ],
};
