import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ModeleMLService } from './modele-ml.service';
import { environment } from '../environments/environment';

describe('ModeleMLService', () => {
  let service: ModeleMLService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ModeleMLService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('rechercher envoie page, size, sort, recherche et type en parametres de requete', () => {
    service
      .rechercher({ page: 1, size: 5, sort: 'dateCreation,desc', recherche: 'ResNet', type: 'VISION' })
      .subscribe();

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/modeles`);
    expect(requete.request.params.get('page')).toBe('1');
    expect(requete.request.params.get('size')).toBe('5');
    expect(requete.request.params.get('sort')).toBe('dateCreation,desc');
    expect(requete.request.params.get('recherche')).toBe('ResNet');
    expect(requete.request.params.get('type')).toBe('VISION');
    requete.flush({ contenu: [], page: 1, taille: 5, totalElements: 0, totalPages: 0, dernier: true });
  });

  it('creer envoie un POST vers /modeles', () => {
    const corps = { nom: 'ResNet-50', type: 'VISION' as const, algorithme: 'CNN', version: '1.0' };
    service.creer(corps).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/modeles`);
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toEqual(corps);
    requete.flush({});
  });

  it('modifier envoie un PUT vers /modeles/{id}', () => {
    const corps = { nom: 'ResNet-50', type: 'VISION' as const, algorithme: 'CNN', version: '2.0' };
    service.modifier(3, corps).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/modeles/3`);
    expect(requete.request.method).toBe('PUT');
    requete.flush({});
  });

  it('supprimer envoie un DELETE vers /modeles/{id}', () => {
    service.supprimer(3).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/modeles/3`);
    expect(requete.request.method).toBe('DELETE');
    requete.flush(null);
  });

  it('trouverParId appelle GET /modeles/{id}', () => {
    service.trouverParId(3).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/modeles/3`);
    expect(requete.request.method).toBe('GET');
    requete.flush({});
  });
});
