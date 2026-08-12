import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => localStorage.clear());

  it('autorise l acces quand l utilisateur est connecte', () => {
    localStorage.setItem(
      'modelbench.session',
      JSON.stringify({ token: 't', login: 'admin', nomComplet: 'Admin', roles: ['ADMIN'] }),
    );

    const resultat = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(resultat).toBe(true);
  });

  it('redirige vers /connexion quand l utilisateur n est pas connecte', () => {
    const router = TestBed.inject(Router);
    const resultat = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(resultat).toEqual(router.parseUrl('/connexion'));
  });
});
