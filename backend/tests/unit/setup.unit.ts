// Runs before unit tests (configured via jest.config) — keep console quieter.
beforeAll(() => {
  // silence logs during unit tests to keep output clean; enable when debugging
  // const original = console.log;
  // console.log = (...args: unknown[]) => {};
});

afterAll(() => {
  // restore if you silenced above
});
