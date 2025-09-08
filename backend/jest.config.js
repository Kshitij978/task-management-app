module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/unit/setup.unit.ts"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts", // exclude startup bootstrap
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "<rootDir>/coverage",
  clearMocks: true,
  testTimeout: 10000,
};
