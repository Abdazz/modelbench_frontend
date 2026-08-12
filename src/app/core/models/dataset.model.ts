export type FormatDataset = 'CSV' | 'JSON' | 'IMAGES' | 'PARQUET' | 'TEXTE' | 'AUDIO';

export interface Dataset {
  id: number;
  nom: string;
  description: string | null;
  source: string;
  nombreObservations: number;
  format: FormatDataset;
  dateAjout: string;
}

export interface DatasetRequest {
  nom: string;
  description: string | null;
  source: string;
  nombreObservations: number;
  format: FormatDataset | null;
}
