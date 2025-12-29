import { APIError, fetchApiResponse } from ".";

// Interface for mtime-aware file responses
export interface FileWithMtime {
  content: string | null;
  mtime: string | null;
}

export const getFileWithMtime = async (
  filename: string,
): Promise<FileWithMtime> => {
  const urlSearchParams = new URLSearchParams({
    configuration: filename,
  });

  try {
    const response = await fetchApiResponse(`./edit?${urlSearchParams.toString()}`);
    const content = await response.text();
    const mtime = response.headers.get("X-File-Mtime");
    return { content, mtime };
  } catch (err) {
    if (err instanceof APIError && err.status === 404) {
      return { content: null, mtime: null };
    }
    throw err;
  }
};

export const writeFileWithMtime = async (
  filename: string,
  content: string,
  mtime?: string,
): Promise<{ newMtime: string | null }> => {
  const params = new URLSearchParams({
    configuration: filename,
  });
  if (mtime !== undefined) {
    params.set("mtime", mtime);
  }

  const response = await fetchApiResponse(`./edit?${params.toString()}`, {
    method: "POST",
    body: content,
  });

  const newMtime = response.headers.get("X-File-Mtime");
  return { newMtime };
};

// null if file not found.
export const getFile = async (filename: string): Promise<string | null> => {
  const { content } = await getFileWithMtime(filename);
  return content;
};

export const writeFile = async (
  filename: string,
  content: string,
): Promise<string> => {
  await writeFileWithMtime(filename, content);
  return "";
};
