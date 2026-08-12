import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => localStorage.clear());

  it('autorise l acces pour un role ADMIN', () => {
    localStorage.setItem(
      'modelbench.session',
      JSON.stringify({ token: 't', login: 'admin', nomComplet: 'Admin', roles: ['ADMIN'] }),
    );
    const resultat = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
    expect(resultat).toBe(true);
  });

  it('redirige vers / pour un role CHERCHEUR', () => {
    localStorage.setItem(
      'modelbench.session',
      JSON.stringify({ token: 't', login: 'chercheur', nomComplet: 'Chercheur', roles: ['CHERCHEUR'] }),
    );
    const router = TestBed.inject(Router);
    const resultat = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
    expect(resultat).toEqual(router.parseUrl('/'));
  });
});
