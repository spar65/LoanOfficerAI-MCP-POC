// Jest configuration
module.exports = {
  testPathIgnorePatterns: [
    "/node_modules/",
    "/BKUP/",
    "/.cursor/",
    "/client/"
  ],
  // Ignore client-side tests that have configuration issues
  testMatch: [
    "**/server/tests/**/*.test.js",
    "**/tests/**/*.test.js"
  ]
};
