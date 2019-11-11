module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ["**/*.ts", "!dist/**", "!**/node_modules/**", "!**/vendor/**"]
};
