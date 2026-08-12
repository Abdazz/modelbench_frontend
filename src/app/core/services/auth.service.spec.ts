import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

describe('AuthService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function creerService(): AuthService {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    return service;
  }

  it('demarre deconnecte quand aucune session n est stockee', () => {
    const service = creerService();
    expect(service.estConnecte()).toBe(false);
    expect(service.utilisateur()).toBeNull();
  });

  it('connecter memorise le jeton, le login et les roles puis les persiste', () => {
    const service = creerService();

    service
      .connecter({ login: 'admin', motDePasse: 'admin123' })
      .subscribe();

    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: 'jeton.de.test',
      typeToken: 'Bearer',
      expirationSecondes: 28800,
      login: 'admin',
      nomComplet: 'Administrateur du laboratoire',
      roles: ['ADMIN'],
    });

    expect(service.estConnecte()).toBe(true);
    expect(service.estAdmin()).toBe(true);
    expect(service.jeton()).toBe('jeton.de.test');
    expect(JSON.parse(localStorage.getItem('modelbench.session')!).login).toBe('admin');
  });

  it('estAdmin est faux pour un role CHERCHEUR', () => {
    const service = creerService();
    service.connecter({ login: 'chercheur', motDePasse: 'chercheur123' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: 'jeton',
      typeToken: 'Bearer',
      expirationSecondes: 28800,
      login: 'chercheur',
      nomComplet: 'Chercheur invite',
      roles: ['CHERCHEUR'],
    });
    expect(service.estAdmin()).toBe(false);
    expect(service.estConnecte()).toBe(true);
  });

  it('deconnecter efface la session en memoire et dans localStorage', () => {
    const service = creerService();
    service.connecter({ login: 'admin', motDePasse: 'admin123' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: 'jeton',
      typeToken: 'Bearer',
      expirationSecondes: 28800,
      login: 'admin',
      nomComplet: 'Administrateur du laboratoire',
      roles: ['ADMIN'],
    });

    service.deconnecter();

    expect(service.estConnecte()).toBe(false);
    expect(localStorage.getItem('modelbench.session')).toBeNull();
  });

  it('restaure une session stockee et la revalide via GET /auth/moi', () => {
    localStorage.setItem(
      'modelbench.session',
      JSON.stringify({ token: 'ancien', login: 'admin', nomComplet: 'Administrateur', roles: ['ADMIN'] }),
    );

    const service = creerService();
    expect(service.estConnecte()).toBe(true);

    const requete = httpMock.expectOne(`${environment.apiUrl}/auth/moi`);
    requete.flush({ login: 'admin', nomComplet: 'Administrateur', roles: ['ADMIN'] });

    expect(service.estConnecte()).toBe(true);
  });

  it('purge la session stockee si GET /auth/moi echoue', () => {
    localStorage.setItem(
      'modelbench.session',
      JSON.stringify({ token: 'expire', login: 'admin', nomComplet: 'Administrateur', roles: ['ADMIN'] }),
    );

    const service = creerService();
    const requete = httpMock.expectOne(`${environment.apiUrl}/auth/moi`);
    requete.flush({ code: 'AUTHENTICATION_REQUIRED' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.estConnecte()).toBe(false);
    expect(localStorage.getItem('modelbench.session')).toBeNull();
  });
});
