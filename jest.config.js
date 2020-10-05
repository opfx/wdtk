module.exports = {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ["<rootDir>/target/"],
  resolver: "<rootDir>/scripts/tools/jest-resolver.js"
};