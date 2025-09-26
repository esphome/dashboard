/**
 * Build a WebSocket URL from a relative path.
 * Automatically handles protocol conversion (http->ws, https->wss)
 * and correctly resolves paths relative to the current location.
 *
 * @param relativePath - Path relative to current location (e.g., "events", "compile")
 * @returns Full WebSocket URL
 */
export const buildWebSocketUrl = (relativePath: string): string => {
  const url = new URL(`./${relativePath}`, location.href);
  url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
  return url.toString();
};