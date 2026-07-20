import { getCookie } from "../util/cookie";
import { buildWebSocketUrl } from "../util/websocket-url";

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "APIError";
  }
}

const fetchApiBase = async (
  path: Parameters<typeof fetch>[0],
  options?: Parameters<typeof fetch>[1],
): ReturnType<typeof fetch> => {
  if (!options) {
    options = {};
  }
  options.credentials = "same-origin";
  const csrfCookie = getCookie("_xsrf");
  if (csrfCookie) {
    if (!options.headers) {
      options.headers = {};
    }
    // @ts-ignore
    options.headers["X-CSRFToken"] = csrfCookie;
  }
  const resp = await fetch(path, options);
  if (!resp.ok) {
    let errMessage = `Request not successful (${resp.status})`;
    try {
      const contentType = resp.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const json = await resp.json();
        errMessage += `: ${json.error}`;
      } else {
        const text = await resp.text();
        if (text) errMessage += `: ${text}`;
      }
    } catch {
      // Ignore parsing errors, use generic message
    }
    throw new APIError(errMessage, resp.status);
  }
  return resp;
};

export const fetchApiText = async (
  path: Parameters<typeof fetch>[0],
  options?: Parameters<typeof fetch>[1],
): Promise<string> => {
  const resp = await fetchApiBase(path, options);
  return resp.text();
};

export const fetchApiJson = async <T>(
  path: Parameters<typeof fetch>[0],
  options?: Parameters<typeof fetch>[1],
): Promise<T> => {
  const resp = await fetchApiBase(path, options);
  return resp.json();
};

export class StreamError extends Error {
  code?: number;
}

export const streamLogs = (
  path: string,
  spawnParams: Record<string, any>,
  lineReceived?: (line: string) => void,
  abortController?: AbortController,
) => {
  const socket = new WebSocket(buildWebSocketUrl(path));

  if (abortController) {
    abortController.signal.addEventListener("abort", () => socket.close());
  }

  return new Promise((resolve, reject) => {
    let done = false;

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "line") {
        if (lineReceived) {
          lineReceived(data.data);
        }
        return;
      }

      if (data.event !== "exit") {
        return;
      }

      done = true;
      socket.close();
      if (data.code === 0) {
        resolve(undefined);
      } else {
        const error = new StreamError(
          `Error compiling configuration (${data.code})`,
        );
        error.code = data.code;
        reject(error);
      }
    });

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "spawn",
          ...spawnParams,
        }),
      );
    });

    socket.addEventListener("close", () => {
      if (!done) {
        reject(new Error("Unexpected socket closure"));
      }
    });
  });
};
