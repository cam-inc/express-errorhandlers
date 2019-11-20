module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ["**/*.ts", "!demo.*", "!dist/**", "!**/node_modules/**", "!**/vendor/**"]
};
