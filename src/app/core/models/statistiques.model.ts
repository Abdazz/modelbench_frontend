import { Experimentation } from './experimentation.model';

export interface SyntheseStatistiques {
  nbDatasets: number;
  nbModeles: number;
  nbExperimentations: number;
  accuracyMoyenne: number | null;
  meilleureExperimentation: Experimentation | null;
}

export interface MeilleurModele {
  datasetId: number;
  datasetNom: string;
  modeleId: number;
  modeleNom: string;
  accuracy: number;
  f1Score: number;
}
