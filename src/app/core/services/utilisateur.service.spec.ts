import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { UtilisateurService } from './utilisateur.service';
import { environment } from '../environments/environment';
import { UtilisateurAdmin } from '../models/utilisateur.model';
import { PageResponse } from '../models/page-response.model';

describe('UtilisateurService', () => {
  let service: UtilisateurService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UtilisateurService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('rechercher envoie page, size, sort, recherche et role en parametres de requete', () => {
    const page: PageResponse<UtilisateurAdmin> = {
      contenu: [],
      page: 0,
      taille: 10,
      totalElements: 0,
      totalPages: 0,
      dernier: true,
    };

    service
      .rechercher({ page: 0, size: 10, sort: 'nomComplet,asc', recherche: 'Marie', role: 'ADMIN' })
      .subscribe((reponse) => expect(reponse).toEqual(page));

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/utilisateurs`);
    expect(requete.request.method).toBe('GET');
    expect(requete.request.params.get('page')).toBe('0');
    expect(requete.request.params.get('size')).toBe('10');
    expect(requete.request.params.get('sort')).toBe('nomComplet,asc');
    expect(requete.request.params.get('recherche')).toBe('Marie');
    expect(requete.request.params.get('role')).toBe('ADMIN');
    requete.flush(page);
  });

  it('rechercher omet recherche et role quand ils sont absents', () => {
    service.rechercher({ page: 0, size: 10 }).subscribe();

    const requete = httpMock.expectOne(`${environment.apiUrl}/utilisateurs?page=0&size=10`);
    expect(requete.request.params.has('recherche')).toBe(false);
    expect(requete.request.params.has('role')).toBe(false);
    requete.flush({ contenu: [], page: 0, taille: 10, totalElements: 0, totalPages: 0, dernier: true });
  });

  it('trouverParId appelle GET /utilisateurs/{id}', () => {
    service.trouverParId(42).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/utilisateurs/42`);
    expect(requete.request.method).toBe('GET');
    requete.flush({});
  });

  it('creer envoie un POST avec le corps de la requete', () => {
    const corps = {
      nomComplet: 'Marie Curie',
      login: 'marie.curie@example.com',
      motDePasse: 'motdepasse123',
      role: 'CHERCHEUR' as const,
      actif: true,
    };
    service.creer(corps).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/utilisateurs`);
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toEqual(corps);
    requete.flush({});
  });

  it('modifier envoie un PUT vers /utilisateurs/{id}', () => {
    const corps = {
      nomComplet: 'Marie Curie',
      login: 'marie.curie@example.com',
      motDePasse: null,
      role: 'CHERCHEUR' as const,
      actif: true,
    };
    service.modifier(7, corps).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/utilisateurs/7`);
    expect(requete.request.method).toBe('PUT');
    expect(requete.request.body).toEqual(corps);
    requete.flush({});
  });

  it('supprimer envoie un DELETE vers /utilisateurs/{id}', () => {
    service.supprimer(7).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/utilisateurs/7`);
    expect(requete.request.method).toBe('DELETE');
    requete.flush(null);
  });
});
