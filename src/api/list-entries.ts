import { fetchApiJson, fetchApiText } from ".";

export interface ConfiguredEntry {
  name: string;
  filename: string;
  loaded_integrations: string[];
  deployed_version: string;
  current_version: string;
  path: string;
  comment: string;
  address: string;
  target_platform: string;
  online_status: boolean;
}

export interface ImportableEntry {
  name: string;
  import_config: string;
  project_name: string;
  project_version: string;
}

export interface ListEntriesResult {
  configured: ConfiguredEntry[];
  importable: ImportableEntry[];
}

export const getDashboardEntries = () =>
  fetchApiJson<ListEntriesResult>("./list-entries");

export const importEntry = (params: ImportableEntry) =>
  fetchApiText("./import", {
    method: "post",
    body: JSON.stringify(params),
  });
