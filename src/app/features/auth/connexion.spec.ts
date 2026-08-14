import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { Connexion } from './connexion';
import { environment } from '../../core/environments/environment';

describe('Connexion', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Connexion],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('le formulaire est invalide tant que login et mot de passe sont vides', () => {
    const fixture = TestBed.createComponent(Connexion);
    const composant = fixture.componentInstance;
    expect(composant['formulaire'].invalid).toBe(true);
  });

  it('navigue vers / apres une connexion reussie', async () => {
    const fixture = TestBed.createComponent(Connexion);
    const composant = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigation = vi.spyOn(router, 'navigateByUrl');

    composant['formulaire'].setValue({ login: 'admin@example.com', motDePasse: 'admin123' });
    composant.soumettre();

    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: 'jeton',
      typeToken: 'Bearer',
      expirationSecondes: 28800,
      login: 'admin',
      nomComplet: 'Administrateur',
      roles: ['ADMIN'],
    });

    expect(navigation).toHaveBeenCalledWith('/');
  });

  it('affiche le message d erreur du serveur sur des identifiants invalides', () => {
    const fixture = TestBed.createComponent(Connexion);
    const composant = fixture.componentInstance;

    composant['formulaire'].setValue({ login: 'admin@example.com', motDePasse: 'mauvais' });
    composant.soumettre();

    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(
      { code: 'AUTHENTICATION_FAILED', message: 'Identifiants invalides' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(composant['erreur']()).toBe('Identifiants invalides');
  });

  it('le controle login est invalide avec une adresse qui n est pas un email', () => {
    const fixture = TestBed.createComponent(Connexion);
    const composant = fixture.componentInstance;
    const controle = composant['formulaire'].get('login')!;

    controle.setValue('admin');

    expect(controle.invalid).toBe(true);
  });
});
