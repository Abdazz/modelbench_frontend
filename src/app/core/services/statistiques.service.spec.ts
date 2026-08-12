import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { StatistiquesService } from './statistiques.service';
import { environment } from '../environments/environment';

describe('StatistiquesService', () => {
  let service: StatistiquesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StatistiquesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('synthese appelle GET /statistiques/synthese', () => {
    service.synthese().subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/statistiques/synthese`);
    expect(requete.request.method).toBe('GET');
    requete.flush({
      nbDatasets: 8,
      nbModeles: 8,
      nbExperimentations: 24,
      accuracyMoyenne: 0.86,
      meilleureExperimentation: null,
    });
  });

  it('meilleursModeles appelle GET /statistiques/meilleurs-modeles', () => {
    service.meilleursModeles().subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/statistiques/meilleurs-modeles`);
    expect(requete.request.method).toBe('GET');
    requete.flush([]);
  });
});
