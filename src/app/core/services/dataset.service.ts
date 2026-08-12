import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';
import { Dataset, DatasetRequest, FormatDataset } from '../models/dataset.model';
import { PageResponse } from '../models/page-response.model';

export interface RechercheDatasetsParams {
  page: number;
  size: number;
  sort?: string;
  recherche?: string;
  format?: FormatDataset;
}

@Injectable({ providedIn: 'root' })
export class DatasetService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/datasets`;

  rechercher(params: RechercheDatasetsParams): Observable<PageResponse<Dataset>> {
    let httpParams = new HttpParams().set('page', params.page).set('size', params.size);
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params.recherche) {
      httpParams = httpParams.set('recherche', params.recherche);
    }
    if (params.format) {
      httpParams = httpParams.set('format', params.format);
    }
    return this.http.get<PageResponse<Dataset>>(this.base, { params: httpParams });
  }

  trouverParId(id: number): Observable<Dataset> {
    return this.http.get<Dataset>(`${this.base}/${id}`);
  }

  creer(requete: DatasetRequest): Observable<Dataset> {
    return this.http.post<Dataset>(this.base, requete);
  }

  modifier(id: number, requete: DatasetRequest): Observable<Dataset> {
    return this.http.put<Dataset>(`${this.base}/${id}`, requete);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
