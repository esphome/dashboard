import { fetchApiText } from ".";

export const ignoreDevice = (configuration: string, ignore: boolean) =>
  fetchApiText("./ignore-device", {
    method: "post",
    body: JSON.stringify({ name: configuration, ignore }),
  });
