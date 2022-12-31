import { fetchApiJson } from ".";

export type SupportedBoards = {
  title?: string;
  items: { [key: string]: string };
}[];

export const getSupportedPlatformBoards = (platform: string) =>
  fetchApiJson<SupportedBoards>(`./boards/${platform}`);
