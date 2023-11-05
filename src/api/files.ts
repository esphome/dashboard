import { APIError, fetchApiText } from ".";

// null if file not found.
export const getFile = async (filename: string): Promise<string | null> => {
  try {
    return fetchApiText(`./edit?configuration=${filename}`);
  } catch (err) {
    if (err instanceof APIError && err.status === 404) {
      return null;
    }
    throw err;
  }
};

export const writeFile = async (
  filename: string,
  content: string,
): Promise<string> =>
  fetchApiText(`./edit?configuration=${filename}`, {
    method: "POST",
    body: content,
  });
