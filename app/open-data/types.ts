export type OpenDataColumn = {
  field_name: string;
  name: string;
  data_type: string;
  description: string | null;
};

export type OpenDataAsset = {
  id: string;
  name: string;
  description: string | null;
  url: string;
  asset_type: string;
  publisher: string | null;
  category: string | null;
  tags: string[];
  updated_at: string | null;
  metadata_url: string;
  columns: OpenDataColumn[];
};

export type OpenDataSnapshot = {
  schema_version: string;
  checked_at: string;
  portal: { name: string; url: string; catalog_url: string };
  summary: { asset_count: number; dataset_count: number; by_type: Record<string, number> };
  assets: OpenDataAsset[];
  archive: { scope: string; history_url: string; payloads_archived: boolean };
  mhc: {
    transition_url: string;
    checked_at: string;
    priority_dataset_ids: string[];
    dictionary_status: string;
    note: string;
  };
};
