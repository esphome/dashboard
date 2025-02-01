import { APIError, fetchApiText } from ".";

// null if file not found.
export const getFile = async (filename: string): Promise<string | null> => {
  try {
    const urlSearchParams = new URLSearchParams({
      configuration: filename,
    });
    return fetchApiText(`./edit?${urlSearchParams.toString()}`);
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
): Promise<string> => {
  const urlSearchParams = new URLSearchParams({
    configuration: filename,
  });
  return fetchApiText(`./edit?${urlSearchParams.toString()}`, {
    method: "POST",
    body: content,
  });
};
