import { fetchApiJson } from ".";

export const getOnlineStatus = () =>
  fetchApiJson<Record<string, boolean>>("./ping");
