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
  return resp.headers.get("content-type").indexOf("application/json") !== -1
    ? resp.json()
    : resp.text();
};

export class StreamError extends Error {
  code?: number;
}

export const streamLogs = (
  path: string,
  spawnParams: Record<string, any>,
  lineReceived?: (line: string) => void,
  abortController?: AbortController
) => {
  const url = new URL(`./${path}`, location.href);
  url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
  const socket = new WebSocket(url.toString());

  if (abortController) {
    abortController.signal.addEventListener("abort", () => socket.close());
  }

  return new Promise((resolve, reject) => {
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "line" && lineReceived) {
        lineReceived(data.data);
        return;
      }

      if (data.event !== "exit") {
        return;
      }

      if (data.code === 0) {
        resolve(undefined);
      } else {
        const error = new StreamError(
          `Error compiling configuration (${data.code})`
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
        })
      );
    });

    socket.addEventListener("close", () => {
      reject(new Error("Unexecpted socket closure"));
    });
  });
};
