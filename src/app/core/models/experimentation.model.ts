export interface Experimentation {
  id: number;
  datasetId: number;
  datasetNom: string;
  modeleId: number;
  modeleNom: string;
  accuracy: number;
  f1Score: number;
  dureeEntrainement: number;
  dateExecution: string;
}

export interface ExperimentationRequest {
  datasetId: number | null;
  modeleId: number | null;
  accuracy: number | null;
  f1Score: number | null;
  dureeEntrainement: number | null;
  dateExecution: string | null;
}
