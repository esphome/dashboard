import { fetchApiJson } from ".";

export interface SupportedBoards {
  [key: string]: {
    title: string;
    items: { [key: string]: string };
  };
}

export const getSupportedPlatformBoards = (platform: string) =>
  fetchApiJson<SupportedBoards>(`./boards/${platform}`);
