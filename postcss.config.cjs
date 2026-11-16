// Keep CSS processing local instead of inheriting a parent directory's config.
// These are the default plugins bundled with the installed Next.js version.
module.exports = {
  plugins: [
    require.resolve("next/dist/compiled/postcss-flexbugs-fixes"),
    [
      require.resolve("next/dist/compiled/postcss-preset-env"),
      {
        browsers: ["defaults"],
        autoprefixer: { flexbox: "no-2009" },
        stage: 3,
        features: { "custom-properties": false },
      },
    ],
  ],
};
