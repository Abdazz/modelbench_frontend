import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { UtilisateurFormulaire } from './utilisateur-formulaire';
import { environment } from '../../core/environments/environment';
import { UtilisateurAdmin } from '../../core/models/utilisateur.model';

describe('UtilisateurFormulaire', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilisateurFormulaire],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function creer(mode: 'creation' | 'edition' = 'creation', donnees: UtilisateurAdmin | null = null) {
    const fixture = TestBed.createComponent(UtilisateurFormulaire);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('donneesInitiales', donnees);
    fixture.detectChanges();
    return fixture;
  }

  it('le formulaire est invalide quand tous les champs sont vides en creation', () => {
    const fixture = creer();
    expect(fixture.componentInstance['formulaire'].invalid).toBe(true);
  });

  it('le mot de passe est obligatoire en creation', () => {
    const fixture = creer('creation');
    const controle = fixture.componentInstance['formulaire'].get('motDePasse')!;
    expect(controle.invalid).toBe(true);
    controle.setValue('motdepasse123');
    expect(controle.invalid).toBe(false);
  });

  it('le mot de passe est optionnel en edition', () => {
    const utilisateur: UtilisateurAdmin = {
      id: 1,
      login: 'marie.curie@example.com',
      nomComplet: 'Marie Curie',
      role: 'CHERCHEUR',
      actif: true,
    };
    const fixture = creer('edition', utilisateur);
    const controle = fixture.componentInstance['formulaire'].get('motDePasse')!;
    expect(controle.value).toBe('');
    expect(controle.invalid).toBe(false);
  });

  it('un mot de passe fourni en edition doit quand meme contenir au moins 8 caracteres', () => {
    const utilisateur: UtilisateurAdmin = {
      id: 1,
      login: 'marie.curie@example.com',
      nomComplet: 'Marie Curie',
      role: 'CHERCHEUR',
      actif: true,
    };
    const fixture = creer('edition', utilisateur);
    const controle = fixture.componentInstance['formulaire'].get('motDePasse')!;
    controle.setValue('court');
    expect(controle.invalid).toBe(true);
  });

  it('login invalide est refuse', () => {
    const fixture = creer();
    const controle = fixture.componentInstance['formulaire'].get('login')!;
    controle.setValue('pasunadresse');
    expect(controle.invalid).toBe(true);
  });

  it('pre-remplit le formulaire en mode edition sans le mot de passe', () => {
    const utilisateur: UtilisateurAdmin = {
      id: 1,
      login: 'marie.curie@example.com',
      nomComplet: 'Marie Curie',
      role: 'ADMIN',
      actif: false,
    };
    const fixture = creer('edition', utilisateur);
    const valeurs = fixture.componentInstance['formulaire'].getRawValue();
    expect(valeurs.nomComplet).toBe('Marie Curie');
    expect(valeurs.login).toBe('marie.curie@example.com');
    expect(valeurs.role).toBe('ADMIN');
    expect(valeurs.actif).toBe(false);
    expect(valeurs.motDePasse).toBe('');
  });

  it('la creation envoie un POST et emet sauvegarde au succes', () => {
    const fixture = creer('creation');
    fixture.componentInstance['formulaire'].setValue({
      nomComplet: 'Marie Curie',
      login: 'marie.curie@example.com',
      motDePasse: 'motdepasse123',
      role: 'CHERCHEUR',
      actif: true,
    });

    fixture.componentInstance.soumettre();

    const requete = httpMock.expectOne(`${environment.apiUrl}/utilisateurs`);
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body.motDePasse).toBe('motdepasse123');
    requete.flush({});
  });

  it('la modification sans mot de passe envoie motDePasse a null', () => {
    const utilisateur: UtilisateurAdmin = {
      id: 7,
      login: 'marie.curie@example.com',
      nomComplet: 'Marie Curie',
      role: 'CHERCHEUR',
      actif: true,
    };
    const fixture = creer('edition', utilisateur);
    fixture.componentInstance.soumettre();

    const requete = httpMock.expectOne(`${environment.apiUrl}/utilisateurs/7`);
    expect(requete.request.method).toBe('PUT');
    expect(requete.request.body.motDePasse).toBeNull();
    requete.flush({});
  });

  it('reinjecte les erreurs de validation du serveur sur les champs concernes', () => {
    const fixture = creer('creation');
    fixture.componentInstance['formulaire'].setValue({
      nomComplet: 'Marie Curie',
      login: 'marie.curie@example.com',
      motDePasse: 'motdepasse123',
      role: 'CHERCHEUR',
      actif: true,
    });

    fixture.componentInstance.soumettre();

    httpMock.expectOne(`${environment.apiUrl}/utilisateurs`).flush(
      {
        timestamp: '2026-08-14T10:00:00Z',
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'La validation a echoue',
        path: '/api/utilisateurs',
        errors: [{ champ: 'login', message: 'Un utilisateur avec cet email existe deja' }],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(fixture.componentInstance['formulaire'].get('login')?.errors).toEqual({
      serveur: 'Un utilisateur avec cet email existe deja',
    });
  });
});
