import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';
import {
  RoleUtilisateur,
  UtilisateurAdmin,
  UtilisateurCreationRequest,
  UtilisateurModificationRequest,
} from '../models/utilisateur.model';
import { PageResponse } from '../models/page-response.model';

export interface RechercheUtilisateursParams {
  page: number;
  size: number;
  sort?: string;
  recherche?: string;
  role?: RoleUtilisateur;
}

@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/utilisateurs`;

  rechercher(params: RechercheUtilisateursParams): Observable<PageResponse<UtilisateurAdmin>> {
    let httpParams = new HttpParams().set('page', params.page).set('size', params.size);
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params.recherche) {
      httpParams = httpParams.set('recherche', params.recherche);
    }
    if (params.role) {
      httpParams = httpParams.set('role', params.role);
    }
    return this.http.get<PageResponse<UtilisateurAdmin>>(this.base, { params: httpParams });
  }

  trouverParId(id: number): Observable<UtilisateurAdmin> {
    return this.http.get<UtilisateurAdmin>(`${this.base}/${id}`);
  }

  creer(requete: UtilisateurCreationRequest): Observable<UtilisateurAdmin> {
    return this.http.post<UtilisateurAdmin>(this.base, requete);
  }

  modifier(id: number, requete: UtilisateurModificationRequest): Observable<UtilisateurAdmin> {
    return this.http.put<UtilisateurAdmin>(`${this.base}/${id}`, requete);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
