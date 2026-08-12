import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'connexion', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('ajoute l en-tete Authorization sur un appel API quand un jeton existe', () => {
    auth.connecter({ login: 'admin', motDePasse: 'admin123' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: 'jeton.test',
      typeToken: 'Bearer',
      expirationSecondes: 28800,
      login: 'admin',
      nomComplet: 'Administrateur',
      roles: ['ADMIN'],
    });

    http.get(`${environment.apiUrl}/datasets`).subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/datasets`);
    expect(requete.request.headers.get('Authorization')).toBe('Bearer jeton.test');
    requete.flush({});
  });

  it('n ajoute pas l en-tete sur /auth/login', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: () => {} });
    const requete = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(requete.request.headers.has('Authorization')).toBe(false);
    requete.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('purge la session et redirige vers /connexion sur un 401', () => {
    const navigation = vi.spyOn(router, 'navigateByUrl');

    http.get(`${environment.apiUrl}/datasets`).subscribe({ error: () => {} });
    httpMock
      .expectOne(`${environment.apiUrl}/datasets`)
      .flush({ code: 'AUTHENTICATION_REQUIRED' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.estConnecte()).toBe(false);
    expect(navigation).toHaveBeenCalledWith('/connexion');
  });
});
