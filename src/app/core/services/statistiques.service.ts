import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';
import { MeilleurModele, SyntheseStatistiques } from '../models/statistiques.model';

@Injectable({ providedIn: 'root' })
export class StatistiquesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/statistiques`;

  synthese(): Observable<SyntheseStatistiques> {
    return this.http.get<SyntheseStatistiques>(`${this.base}/synthese`);
  }

  meilleursModeles(): Observable<MeilleurModele[]> {
    return this.http.get<MeilleurModele[]>(`${this.base}/meilleurs-modeles`);
  }
}
