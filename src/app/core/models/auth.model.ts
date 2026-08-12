export interface ConnexionRequest {
  login: string;
  motDePasse: string;
}

export interface ConnexionResponse {
  token: string;
  typeToken: string;
  expirationSecondes: number;
  login: string;
  nomComplet: string;
  roles: string[];
}

export interface Utilisateur {
  login: string;
  nomComplet: string;
  roles: string[];
}
