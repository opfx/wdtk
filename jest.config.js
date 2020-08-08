module.exports = {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
};