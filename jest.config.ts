export default {
  bail: true,
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}"
  ],
  roots: [
    "<rootDir>/src/",
    "<rootDir>/test/"
  ],
  testEnvironment: "node",
  testRegex: "(/__tests__/.*|(\\.|/)(test))\\.[tj]sx?$",
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  verbose: true,
};
