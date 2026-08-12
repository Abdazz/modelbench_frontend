import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MessageService, ConfirmationService } from 'primeng/api';

import { ExperimentationListe } from './experimentation-liste';
import { environment } from '../../core/environments/environment';
import { PageResponse } from '../../core/models/page-response.model';
import { Experimentation } from '../../core/models/experimentation.model';
import { Dataset } from '../../core/models/dataset.model';
import { ModeleML } from '../../core/models/modele-ml.model';

const CLE_SESSION = 'modelbench.session';

const pageVide = (page = 0): PageResponse<Experimentation> => ({
  contenu: [],
  page,
  taille: 10,
  totalElements: 0,
  totalPages: 0,
  dernier: true,
});

const pageDatasets = (): PageResponse<Dataset> => ({
  contenu: [
    { id: 1, nom: 'MNIST', description: null, source: 'Kaggle', nombreObservations: 70000, format: 'IMAGES', dateAjout: '2026-01-01' },
  ],
  page: 0,
  taille: 1000,
  totalElements: 1,
  totalPages: 1,
  dernier: true,
});

const pageModeles = (): PageResponse<ModeleML> => ({
  contenu: [{ id: 1, nom: 'ResNet-50', type: 'VISION', algorithme: 'CNN', version: '1.0', dateCreation: '2026-01-01' }],
  page: 0,
  taille: 1000,
  totalElements: 1,
  totalPages: 1,
  dernier: true,
});

describe('ExperimentationListe', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ExperimentationListe],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    vi.useRealTimers();
  });

  // La construction du composant abonne immediatement DatasetService.rechercher() et
  // ModeleMLService.rechercher() (page large size:1000, pour peupler les deux p-select de
  // rattachement), et, si une session est deja stockee, AuthService interroge aussi GET /auth/moi
  // pour la revalider. Le premier detectChanges() rend le p-table (lazy=true), qui declenche
  // lui-meme un onLazyLoad automatique avec des valeurs par defaut. On solde ces quatre appels ici
  // pour que chaque test ne voie plus ensuite que les appels qu'il provoque explicitement
  // (charger/surRecherche/...).
  function creer() {
    const fixture = TestBed.createComponent(ExperimentationListe);
    httpMock
      .match((r) => r.url === `${environment.apiUrl}/auth/moi`)
      .forEach((requete) => requete.flush({ login: 'admin', nomComplet: 'Administrateur', roles: ['ADMIN'] }));
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/datasets`).flush(pageDatasets());
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/modeles`).flush(pageModeles());

    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`).flush(pageVide());

    return fixture;
  }

  // debounceTime/distinctUntilChanged de rxjs utilisent les timers globaux : on bascule sur des
  // timers factices deterministes (vi) au lieu d'attendre le temps reel, pour ne pas dependre de
  // la charge de la machine executant les tests.
  async function avancerDebounce(ms = 300): Promise<void> {
    await vi.advanceTimersByTimeAsync(ms);
  }

  it('calcule une page zero-based a partir de first et rows', () => {
    const fixture = creer();
    fixture.componentInstance.charger({ first: 0, rows: 10 });

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.get('page')).toBe('0');
    expect(requete.request.params.get('size')).toBe('10');
    requete.flush(pageVide(0));
  });

  it('calcule la page 2 quand first=20 et rows=10', () => {
    const fixture = creer();
    fixture.componentInstance.charger({ first: 20, rows: 10 });

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.get('page')).toBe('2');
    expect(requete.request.params.get('size')).toBe('10');
    requete.flush(pageVide(2));
  });

  it('un evenement lazy load direct depuis la table conserve la page demandee (pas de retour a 0)', () => {
    const fixture = creer();
    fixture.componentInstance.charger({ first: 30, rows: 10 });

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.get('page')).toBe('3');
    requete.flush(pageVide(3));
  });

  it('extrait le champ de tri et l ordre quand sortField est une chaine', () => {
    const fixture = creer();
    fixture.componentInstance.charger({ first: 0, rows: 10, sortField: 'accuracy', sortOrder: 1 });

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.get('sort')).toBe('accuracy,asc');
    requete.flush(pageVide());
  });

  it('extrait le premier champ de tri quand sortField est un tableau, avec ordre descendant', () => {
    const fixture = creer();
    fixture.componentInstance.charger({
      first: 0,
      rows: 10,
      sortField: ['dateExecution', 'accuracy'],
      sortOrder: -1,
    });

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.get('sort')).toBe('dateExecution,desc');
    requete.flush(pageVide());
  });

  it('n envoie pas de parametre sort en l absence de sortField', () => {
    const fixture = creer();
    fixture.componentInstance.charger({ first: 0, rows: 10 });

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.has('sort')).toBe(false);
    requete.flush(pageVide());
  });

  it('ne recharge pas immediatement lors de la saisie de recherche (debounce de 300ms)', async () => {
    vi.useFakeTimers();
    const fixture = creer();
    const composant = fixture.componentInstance;

    composant.surRecherche('resnet');
    await avancerDebounce(100);

    httpMock.expectNone((r) => r.url === `${environment.apiUrl}/experimentations`);
  });

  it('recharge apres le delai de debounce et revient a la page 0 meme depuis une page avancee', async () => {
    vi.useFakeTimers();
    const fixture = creer();
    const composant = fixture.componentInstance;
    composant.charger({ first: 20, rows: 10 });
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`).flush(pageVide(2));

    composant.surRecherche('resnet');
    await avancerDebounce(300);

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.get('page')).toBe('0');
    expect(requete.request.params.get('recherche')).toBe('resnet');
    requete.flush(pageVide(0));
  });

  it('applique distinctUntilChanged : une meme valeur de recherche repetee ne recharge pas deux fois', async () => {
    vi.useFakeTimers();
    const fixture = creer();
    const composant = fixture.componentInstance;

    composant.surRecherche('resnet');
    await avancerDebounce(300);
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`).flush(pageVide());

    composant.surRecherche('resnet');
    await avancerDebounce(300);
    httpMock.expectNone((r) => r.url === `${environment.apiUrl}/experimentations`);
  });

  it('une nouvelle valeur de recherche distincte declenche bien un nouveau rechargement', async () => {
    vi.useFakeTimers();
    const fixture = creer();
    const composant = fixture.componentInstance;

    composant.surRecherche('resnet');
    await avancerDebounce(300);
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`).flush(pageVide());

    composant.surRecherche('bert');
    await avancerDebounce(300);
    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.get('recherche')).toBe('bert');
    requete.flush(pageVide());
  });

  it('le changement de dataset recharge et revient a la page 0', () => {
    const fixture = creer();
    const composant = fixture.componentInstance;
    composant.charger({ first: 20, rows: 10 });
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`).flush(pageVide(2));

    composant.surChangementDataset(1);

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.get('page')).toBe('0');
    expect(requete.request.params.get('datasetId')).toBe('1');
    requete.flush(pageVide(0));
  });

  it('le changement de modele recharge et revient a la page 0', () => {
    const fixture = creer();
    const composant = fixture.componentInstance;
    composant.charger({ first: 20, rows: 10 });
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`).flush(pageVide(2));

    composant.surChangementModele(1);

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.get('page')).toBe('0');
    expect(requete.request.params.get('modeleId')).toBe('1');
    requete.flush(pageVide(0));
  });

  it('le changement d accuracy minimum recharge et revient a la page 0', () => {
    const fixture = creer();
    const composant = fixture.componentInstance;
    composant.charger({ first: 20, rows: 10 });
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`).flush(pageVide(2));

    composant.surAccuracyMin(0.5);

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.get('page')).toBe('0');
    expect(requete.request.params.get('accuracyMin')).toBe('0.5');
    requete.flush(pageVide(0));
  });

  it('le changement d accuracy maximum recharge et revient a la page 0', () => {
    const fixture = creer();
    const composant = fixture.componentInstance;
    composant.charger({ first: 20, rows: 10 });
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`).flush(pageVide(2));

    composant.surAccuracyMax(0.9);

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.get('page')).toBe('0');
    expect(requete.request.params.get('accuracyMax')).toBe('0.9');
    requete.flush(pageVide(0));
  });

  it('une valeur d accuracy min nulle efface le filtre (pas de parametre envoye)', () => {
    const fixture = creer();
    const composant = fixture.componentInstance;
    composant.surAccuracyMin(0.5);
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`).flush(pageVide());

    composant.surAccuracyMin(null);

    const requete = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/experimentations`);
    expect(requete.request.params.has('accuracyMin')).toBe(false);
    requete.flush(pageVide());
  });

  it('estAdmin est faux quand aucune session n est active', () => {
    const fixture = creer();
    expect(fixture.componentInstance['estAdmin']()).toBe(false);
  });

  it('estAdmin est vrai quand la session stockee porte le role ADMIN', () => {
    localStorage.setItem(
      CLE_SESSION,
      JSON.stringify({ token: 't', login: 'admin', nomComplet: 'Administrateur', roles: ['ADMIN'] }),
    );
    const fixture = creer();
    expect(fixture.componentInstance['estAdmin']()).toBe(true);
  });

  it('estAdmin est faux quand la session stockee ne porte que le role CHERCHEUR', () => {
    localStorage.setItem(
      CLE_SESSION,
      JSON.stringify({ token: 't', login: 'chercheur', nomComplet: 'Chercheur', roles: ['CHERCHEUR'] }),
    );
    const fixture = creer();
    expect(fixture.componentInstance['estAdmin']()).toBe(false);
  });
});
