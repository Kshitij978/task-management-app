export function makeClientMock(results: Array<any>) {
  const clientQuery = jest
    .fn()
    // For each element in results array, queue a resolved value (or rejected if element is an Error)
    .mockImplementationOnce(() => {}); // placeholder, will be replaced below
  // Reset and implement sequential responses
  clientQuery.mockReset();
  for (const r of results) {
    if (r instanceof Error) {
      clientQuery.mockRejectedValueOnce(r);
    } else {
      clientQuery.mockResolvedValueOnce(r);
    }
  }

  const client = {
    query: clientQuery,
    release: jest.fn(),
  };

  return client;
}
