export type TypeModele =
  | 'CLASSIFICATION'
  | 'REGRESSION'
  | 'CLUSTERING'
  | 'REDUCTION_DIMENSION'
  | 'NLP'
  | 'VISION';

export interface ModeleML {
  id: number;
  nom: string;
  type: TypeModele;
  algorithme: string;
  version: string;
  dateCreation: string;
}

export interface ModeleMLRequest {
  nom: string;
  type: TypeModele | null;
  algorithme: string;
  version: string;
}
