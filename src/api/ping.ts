import { fetchApi } from ".";

export const getOnlineStatus = () =>
  fetchApi<Record<string, boolean>>("./ping");
