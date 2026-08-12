import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { DatasetService } from './dataset.service';
import { environment } from '../environments/environment';
import { Dataset } from '../models/dataset.model';
import { PageResponse } from '../models/page-response.model';

describe('DatasetService', () => {
  let service: DatasetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DatasetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('rechercher envoie page, size, sort, recherche et format en parametres de requete', () => {
    const page: PageResponse<Dataset> = {
      contenu: [],
      page: 0,
      taille: 10,
      totalElements: 0,
      totalPages: 0,
      dernier: true,
    };

    service
      .rechercher({ page: 0, size: 10, sort: 'nom,asc', recherche: 'MNIST', format: 'IMAGES' })
      .subscribe((reponse) => expect(reponse).toEqual(page));

    const requete = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/datasets`,
    );
    expect(requete.request.method).toBe('GET');
    expect(requete.request.params.get('page')).toBe('0');
    expect(requete.request.params.get('size')).toBe('10');
    expect(requete.request.params.get('sort')).toBe('nom,asc');
    expect(requete.request.params.get('recherche')).toBe('MNIST');
    expect(requete.request.params.get('format')).toBe('IMAGES');
    requete.flush(page);
  });

  it('rechercher omet recherche et format quand ils sont absents', () => {
    service.rechercher({ page: 0, size: 10 }).subscribe();

    const requete = httpMock.expectOne(`${environment.apiUrl}/datasets?page=0&size=10`);
    expect(requete.request.params.has('recherche')).toBe(false);
    expect(requete.request.params.has('format')).toBe(false);
    requete.flush({ contenu: [], page: 0, taille: 10, totalElements: 0, totalPages: 0, dernier: true });
  });

  it('trouverParId appelle GET /datasets/{id}', () => {
    service.trouverParId(42).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/datasets/42`);
    expect(requete.request.method).toBe('GET');
    requete.flush({});
  });

  it('creer envoie un POST avec le corps de la requete', () => {
    const corps = { nom: 'MNIST', description: null, source: 'Kaggle', nombreObservations: 70000, format: 'IMAGES' as const };
    service.creer(corps).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/datasets`);
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toEqual(corps);
    requete.flush({});
  });

  it('modifier envoie un PUT vers /datasets/{id}', () => {
    const corps = { nom: 'MNIST', description: null, source: 'Kaggle', nombreObservations: 70000, format: 'IMAGES' as const };
    service.modifier(7, corps).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/datasets/7`);
    expect(requete.request.method).toBe('PUT');
    expect(requete.request.body).toEqual(corps);
    requete.flush({});
  });

  it('supprimer envoie un DELETE vers /datasets/{id}', () => {
    service.supprimer(7).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/datasets/7`);
    expect(requete.request.method).toBe('DELETE');
    requete.flush(null);
  });
});
