export type RoleUtilisateur = 'ADMIN' | 'CHERCHEUR';

export interface UtilisateurAdmin {
  id: number;
  login: string;
  nomComplet: string;
  role: RoleUtilisateur;
  actif: boolean;
}

export interface UtilisateurCreationRequest {
  nomComplet: string;
  login: string;
  motDePasse: string;
  role: RoleUtilisateur;
  actif: boolean;
}

export interface UtilisateurModificationRequest {
  nomComplet: string;
  login: string;
  motDePasse: string | null;
  role: RoleUtilisateur;
  actif: boolean;
}
