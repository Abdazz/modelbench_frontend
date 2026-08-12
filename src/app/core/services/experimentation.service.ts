import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';
import { Experimentation, ExperimentationRequest } from '../models/experimentation.model';
import { PageResponse } from '../models/page-response.model';

export interface RechercheExperimentationsParams {
  page: number;
  size: number;
  sort?: string;
  recherche?: string;
  datasetId?: number;
  modeleId?: number;
  accuracyMin?: number;
  accuracyMax?: number;
}

@Injectable({ providedIn: 'root' })
export class ExperimentationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/experimentations`;

  rechercher(params: RechercheExperimentationsParams): Observable<PageResponse<Experimentation>> {
    let httpParams = new HttpParams().set('page', params.page).set('size', params.size);
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params.recherche) {
      httpParams = httpParams.set('recherche', params.recherche);
    }
    if (params.datasetId !== undefined) {
      httpParams = httpParams.set('datasetId', params.datasetId);
    }
    if (params.modeleId !== undefined) {
      httpParams = httpParams.set('modeleId', params.modeleId);
    }
    if (params.accuracyMin !== undefined) {
      httpParams = httpParams.set('accuracyMin', params.accuracyMin);
    }
    if (params.accuracyMax !== undefined) {
      httpParams = httpParams.set('accuracyMax', params.accuracyMax);
    }
    return this.http.get<PageResponse<Experimentation>>(this.base, { params: httpParams });
  }

  trouverParId(id: number): Observable<Experimentation> {
    return this.http.get<Experimentation>(`${this.base}/${id}`);
  }

  creer(requete: ExperimentationRequest): Observable<Experimentation> {
    return this.http.post<Experimentation>(this.base, requete);
  }

  modifier(id: number, requete: ExperimentationRequest): Observable<Experimentation> {
    return this.http.put<Experimentation>(`${this.base}/${id}`, requete);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
