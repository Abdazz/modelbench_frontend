import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MessageService, ConfirmationService } from 'primeng/api';

import { UtilisateurListe } from './utilisateur-liste';
import { environment } from '../../core/environments/environment';
import { PageResponse } from '../../core/models/page-response.model';
import { UtilisateurAdmin } from '../../core/models/utilisateur.model';

const pageVide = (page = 0): PageResponse<UtilisateurAdmin> => ({
  contenu: [],
  page,
  taille: 10,
  totalElements: 0,
  totalPages: 0,
  dernier: true,
});

describe('UtilisateurListe', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilisateurListe],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService, ConfirmationService],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function creer() {
    const fixture = TestBed.createComponent(UtilisateurListe);
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/utilisateurs`).flush(pageVide());
    return fixture;
  }

  it('calcule une page zero-based a partir de first et rows', () => {
    const fixture = creer();
    fixture.componentInstance.charger({ first: 0, rows: 10 });

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/utilisateurs`);
    expect(requete.request.params.get('page')).toBe('0');
    expect(requete.request.params.get('size')).toBe('10');
    requete.flush(pageVide(0));
  });

  it('le changement de role recharge et revient a la page 0', () => {
    const fixture = creer();
    const composant = fixture.componentInstance;
    composant.charger({ first: 20, rows: 10 });
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/utilisateurs`).flush(pageVide(2));

    composant.surChangementRole('ADMIN');

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/utilisateurs`);
    expect(requete.request.params.get('page')).toBe('0');
    expect(requete.request.params.get('role')).toBe('ADMIN');
    requete.flush(pageVide(0));
  });

  it('ouvrirCreation prepare le dialogue en mode creation', () => {
    const fixture = creer();
    fixture.componentInstance.ouvrirCreation();
    expect(fixture.componentInstance['modeDialogue']()).toBe('creation');
    expect(fixture.componentInstance['dialogueVisible']()).toBe(true);
  });

  it('ouvrirEdition prepare le dialogue en mode edition avec l utilisateur choisi', () => {
    const fixture = creer();
    const utilisateur: UtilisateurAdmin = {
      id: 1,
      login: 'marie.curie@example.com',
      nomComplet: 'Marie Curie',
      role: 'CHERCHEUR',
      actif: true,
    };
    fixture.componentInstance.ouvrirEdition(utilisateur);
    expect(fixture.componentInstance['modeDialogue']()).toBe('edition');
    expect(fixture.componentInstance['utilisateurEnEdition']()).toEqual(utilisateur);
  });

  it('surSauvegarde ferme le dialogue et recharge la liste', () => {
    const fixture = creer();
    fixture.componentInstance.ouvrirCreation();

    fixture.componentInstance.surSauvegarde();

    expect(fixture.componentInstance['dialogueVisible']()).toBe(false);
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/utilisateurs`).flush(pageVide());
  });
});
