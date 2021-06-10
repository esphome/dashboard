export const fetchApi = async <T>(
  path: Parameters<typeof fetch>[0],
  options?: Parameters<typeof fetch>[1]
): Promise<T> => {
  if (!options) {
    options = {};
  }
  options.credentials = "same-origin";
  const resp = await fetch(path, options);
  if (!resp.ok) {
    throw new Error(`Request not successful (${resp.status})`);
  }
  return resp.headers.get("content-type") === "application/json"
    ? resp.json()
    : resp.text();
};
