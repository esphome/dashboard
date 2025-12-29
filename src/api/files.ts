import { APIError } from ".";
import { getCookie } from "../util/cookie";

// Interface for mtime-aware file responses
export interface FileWithMtime {
  content: string | null;
  mtime: string | null;
}

export const getFileWithMtime = async (
  filename: string
): Promise<FileWithMtime> => {
  try {
    const urlSearchParams = new URLSearchParams({
      configuration: filename,
    });
    const response = await fetch(`./edit?${urlSearchParams.toString()}`);

    if (!response.ok && response.status !== 404) {
      throw new APIError(`Request failed (${response.status})`, response.status);
    }

    if (response.status === 404) {
      return { content: null, mtime: null };
    }

    const content = await response.text();
    const mtime = response.headers.get('X-File-Mtime');
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
  mtime?: string
): Promise<{ newMtime: string | null }> => {
  const params = new URLSearchParams({
    configuration: filename,
  });
  if (mtime !== undefined) {
    params.set('mtime', mtime);
  }


  const response = await fetch(`./edit?${params.toString()}`, {
    method: 'POST',
    body: content,
    credentials: 'same-origin',
    headers: {
      'X-CSRFToken': getCookie('_xsrf') || '',
    },
  });

  if (!response.ok) {
    let errMessage = `Request not successful (${response.status})`;
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        errMessage += `: ${json.error}`;
      } else {
        const text = await response.text();
        if (text) errMessage += `: ${text}`;
      }
    } catch {
      // Ignore parsing errors
    }
    throw new APIError(errMessage, response.status);
  }

  const newMtime = response.headers.get('X-File-Mtime');
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
  return '';
};
