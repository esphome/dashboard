import { fetchApiJson } from ".";

export interface SupportedBoards {
  esp32: { [key: string]: string }
  esp8266: { [key: string]: string }
  rp2040: { [key: string]: string }
};

export const getSupportedBoards = () =>
  fetchApiJson<SupportedBoards>("./boards");
