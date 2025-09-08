// A single shared mock for the pg pool used in unit tests.
// Exposes: query, connect, end. connect() resolves to a client { query, release }.

const query = jest.fn();
const end = jest.fn();

// Default client used by pool.connect(); tests may override by calling mockResolvedValueOnce on connect.
const defaultClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const connect = jest.fn().mockResolvedValue(defaultClient);

export default {
  query,
  connect,
  end,
  // helpers for tests to inspect/clear
  __defaultClient: defaultClient,
};
