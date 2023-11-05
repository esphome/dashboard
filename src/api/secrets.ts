import { APIError, fetchApiJson } from ".";
import { getFile, writeFile } from "./files";

export const SECRETS_FILE = "secrets.yaml";

export const getSecretKeys = async (): Promise<string[]> => {
  try {
    return await fetchApiJson("./secret_keys");
  } catch (err: any) {
    if (err instanceof APIError && err.status === 404) {
      return [];
    }
    throw err;
  }
};

export const appendSecrets = async (
  secrets: Record<string, string>,
  comment?: string,
): Promise<void> => {
  let content = await getFile(SECRETS_FILE);
  if (content === null) {
    content = "";
  }

  let toAppend =
    content.length === 0
      ? ""
      : content.charAt(content.length - 1) !== "\n"
      ? "\n\n"
      : "\n";

  if (comment) {
    toAppend += `# ${comment}\n`;
  }

  for (const [key, value] of Object.entries(secrets)) {
    toAppend += `${key}: ${JSON.stringify(value)}\n`;
  }

  await writeFile(SECRETS_FILE, content + toAppend);
};
