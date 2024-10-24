import { fetchApiJson } from ".";

export const ignoreDevice = (configuration: string, ignore: boolean) =>
  fetchApiJson<{ configuration: string }>("./ignore-device", {
    method: "post",
    body: JSON.stringify({ name: configuration, ignore }),
  });
