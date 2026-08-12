import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';
import { ValeurReference } from '../models/reference.model';

@Injectable({ providedIn: 'root' })
export class ReferenceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reference`;

  formatsDataset(): Observable<ValeurReference[]> {
    return this.http.get<ValeurReference[]>(`${this.base}/formats-dataset`);
  }

  typesModele(): Observable<ValeurReference[]> {
    return this.http.get<ValeurReference[]>(`${this.base}/types-modele`);
  }
}
