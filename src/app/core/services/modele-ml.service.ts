import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';
import { ModeleML, ModeleMLRequest, TypeModele } from '../models/modele-ml.model';
import { PageResponse } from '../models/page-response.model';

export interface RechercheModelesParams {
  page: number;
  size: number;
  sort?: string;
  recherche?: string;
  type?: TypeModele;
}

@Injectable({ providedIn: 'root' })
export class ModeleMLService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/modeles`;

  rechercher(params: RechercheModelesParams): Observable<PageResponse<ModeleML>> {
    let httpParams = new HttpParams().set('page', params.page).set('size', params.size);
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params.recherche) {
      httpParams = httpParams.set('recherche', params.recherche);
    }
    if (params.type) {
      httpParams = httpParams.set('type', params.type);
    }
    return this.http.get<PageResponse<ModeleML>>(this.base, { params: httpParams });
  }

  trouverParId(id: number): Observable<ModeleML> {
    return this.http.get<ModeleML>(`${this.base}/${id}`);
  }

  creer(requete: ModeleMLRequest): Observable<ModeleML> {
    return this.http.post<ModeleML>(this.base, requete);
  }

  modifier(id: number, requete: ModeleMLRequest): Observable<ModeleML> {
    return this.http.put<ModeleML>(`${this.base}/${id}`, requete);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
