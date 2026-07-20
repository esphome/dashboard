import { APIError, fetchApiText } from ".";

const editUrl = (filename: string): string => {
  const urlSearchParams = new URLSearchParams({
    configuration: filename,
  });
  return `./edit?${urlSearchParams.toString()}`;
};

// null if file not found.
export const getFile = async (filename: string): Promise<string | null> => {
  try {
    return fetchApiText(editUrl(filename), { cache: "no-store" });
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
  const url = editUrl(filename);
  await fetchApiText(url, {
    method: "POST",
    body: content,
    cache: "no-store",
  });

  const savedContent = await fetchApiText(url, { cache: "no-store" });
  if (savedContent !== content) {
    throw new Error(
      "Save verification failed: saved content does not match editor content",
    );
  }
  return savedContent;
};
