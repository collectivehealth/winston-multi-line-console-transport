const ALWAYS_IGNORE = [
  '<rootDir>/dist',
  '/node_modules/'
];

const EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'node'];

module.exports = {
  testEnvironment: 'node',
  testRegex: '^.+\\.spec.ts$',
  testPathIgnorePatterns: ALWAYS_IGNORE,
  coveragePathIgnorePatterns: ALWAYS_IGNORE,
  moduleFileExtensions: EXTENSIONS,
  transform: {
    [`^.+\\.(${EXTENSIONS.join('|')})$`]: 'babel-jest'
  },
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 90,
      functions: 100,
      lines: 100
    }
  }
};
