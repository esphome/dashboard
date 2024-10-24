import { fetchApiBase } from ".";

export const ignoreDevice = (configuration: string, ignore: boolean) =>
  fetchApiBase<{ configuration: string }>("./ignore-device", {
    method: "post",
    body: JSON.stringify({ name: configuration, ignore }),
  });
