import { fetchApiJson } from ".";
import { createPollingCollection } from "../util/polling-collection";

export const getOnlineStatus = () =>
  fetchApiJson<Record<string, boolean>>("./ping");

export const subscribeOnlineStatus = createPollingCollection(
  getOnlineStatus,
  2000
);
