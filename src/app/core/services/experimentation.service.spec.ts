import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ExperimentationService } from './experimentation.service';
import { environment } from '../environments/environment';

describe('ExperimentationService', () => {
  let service: ExperimentationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExperimentationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('rechercher envoie tous les filtres optionnels en parametres de requete', () => {
    service
      .rechercher({
        page: 0,
        size: 10,
        sort: 'dateExecution,desc',
        recherche: 'MNIST',
        datasetId: 1,
        modeleId: 2,
        accuracyMin: 0.5,
        accuracyMax: 0.9,
      })
      .subscribe();

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.get('datasetId')).toBe('1');
    expect(requete.request.params.get('modeleId')).toBe('2');
    expect(requete.request.params.get('accuracyMin')).toBe('0.5');
    expect(requete.request.params.get('accuracyMax')).toBe('0.9');
    requete.flush({ contenu: [], page: 0, taille: 10, totalElements: 0, totalPages: 0, dernier: true });
  });

  it('rechercher omet les filtres numeriques quand ils sont absents (pas de 0 par defaut)', () => {
    service.rechercher({ page: 0, size: 10 }).subscribe();
    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.has('datasetId')).toBe(false);
    expect(requete.request.params.has('accuracyMin')).toBe(false);
    requete.flush({ contenu: [], page: 0, taille: 10, totalElements: 0, totalPages: 0, dernier: true });
  });

  it('creer envoie un POST vers /experimentations', () => {
    const corps = {
      datasetId: 1,
      modeleId: 1,
      accuracy: 0.98,
      f1Score: 0.97,
      dureeEntrainement: 7245,
      dateExecution: '2026-05-01T10:30:00',
    };
    service.creer(corps).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/experimentations`);
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toEqual(corps);
    requete.flush({});
  });

  it('supprimer envoie un DELETE vers /experimentations/{id}', () => {
    service.supprimer(9).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/experimentations/9`);
    expect(requete.request.method).toBe('DELETE');
    requete.flush(null);
  });
});
