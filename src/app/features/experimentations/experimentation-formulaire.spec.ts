import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ExperimentationFormulaire } from './experimentation-formulaire';
import { environment } from '../../core/environments/environment';
import { Experimentation } from '../../core/models/experimentation.model';
import { Dataset } from '../../core/models/dataset.model';
import { ModeleML } from '../../core/models/modele-ml.model';

describe('ExperimentationFormulaire', () => {
  let httpMock: HttpTestingController;

  const datasets: Dataset[] = [
    { id: 1, nom: 'MNIST', description: null, source: 'Kaggle', nombreObservations: 70000, format: 'IMAGES', dateAjout: '2026-01-01' },
  ];
  const modeles: ModeleML[] = [
    { id: 1, nom: 'ResNet-50', type: 'VISION', algorithme: 'CNN', version: '1.0', dateCreation: '2026-01-01' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperimentationFormulaire],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function creer(mode: 'creation' | 'edition' = 'creation', donnees: Experimentation | null = null) {
    const fixture = TestBed.createComponent(ExperimentationFormulaire);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('donneesInitiales', donnees);
    fixture.componentRef.setInput('datasets', datasets);
    fixture.componentRef.setInput('modeles', modeles);
    fixture.detectChanges();
    return fixture;
  }

  it('le formulaire est invalide quand tous les champs sont vides', () => {
    const fixture = creer();
    expect(fixture.componentInstance['formulaire'].invalid).toBe(true);
  });

  it('accuracy superieure a 1 est invalide', () => {
    const fixture = creer();
    const controle = fixture.componentInstance['formulaire'].get('accuracy')!;
    controle.setValue(1.5);
    expect(controle.invalid).toBe(true);
  });

  it('dureeEntrainement nulle ou negative est invalide', () => {
    const fixture = creer();
    const controle = fixture.componentInstance['formulaire'].get('dureeEntrainement')!;
    controle.setValue(0);
    expect(controle.invalid).toBe(true);
  });

  it('une date d execution dans le futur est invalide', () => {
    const fixture = creer();
    const controle = fixture.componentInstance['formulaire'].get('dateExecution')!;
    controle.setValue(new Date(Date.now() + 24 * 60 * 60 * 1000));
    expect(controle.invalid).toBe(true);
    expect(controle.errors).toEqual({ futur: true });
  });

  it('une date d execution passee est valide', () => {
    const fixture = creer();
    const controle = fixture.componentInstance['formulaire'].get('dateExecution')!;
    controle.setValue(new Date('2026-01-01T10:00:00'));
    expect(controle.valid).toBe(true);
  });

  it('le formulaire est valide avec des valeurs conformes', () => {
    const fixture = creer();
    fixture.componentInstance['formulaire'].setValue({
      datasetId: 1,
      modeleId: 1,
      accuracy: 0.98,
      f1Score: 0.97,
      dureeEntrainement: 7245,
      dateExecution: new Date('2026-05-01T10:30:00'),
    });
    expect(fixture.componentInstance['formulaire'].valid).toBe(true);
  });

  it('pre-remplit le formulaire en mode edition en convertissant la date en objet Date', () => {
    const experimentation: Experimentation = {
      id: 1,
      datasetId: 1,
      datasetNom: 'MNIST',
      modeleId: 1,
      modeleNom: 'ResNet-50',
      accuracy: 0.98,
      f1Score: 0.97,
      dureeEntrainement: 7245,
      dateExecution: '2026-05-01T10:30:00',
    };
    const fixture = creer('edition', experimentation);
    expect(fixture.componentInstance['formulaire'].get('dateExecution')?.value).toBeInstanceOf(Date);
  });

  it('envoie dateExecution au format LocalDateTime sans fuseau a la soumission', () => {
    const fixture = creer();
    fixture.componentInstance['formulaire'].setValue({
      datasetId: 1,
      modeleId: 1,
      accuracy: 0.98,
      f1Score: 0.97,
      dureeEntrainement: 7245,
      dateExecution: new Date(2026, 4, 1, 10, 30, 0),
    });

    fixture.componentInstance.soumettre();

    const requete = httpMock.expectOne(`${environment.apiUrl}/experimentations`);
    expect(requete.request.body.dateExecution).toBe('2026-05-01T10:30:00');
    requete.flush({});
  });

  it('reinjecte les erreurs de validation du serveur sur les champs concernes', () => {
    const fixture = creer();
    fixture.componentInstance['formulaire'].setValue({
      datasetId: 1,
      modeleId: 1,
      accuracy: 0.98,
      f1Score: 0.97,
      dureeEntrainement: 7245,
      dateExecution: new Date('2026-05-01T10:30:00'),
    });

    fixture.componentInstance.soumettre();

    httpMock.expectOne(`${environment.apiUrl}/experimentations`).flush(
      {
        timestamp: '2026-08-12T10:00:00Z',
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'La validation a echoue',
        path: '/api/experimentations',
        errors: [{ champ: 'accuracy', message: 'Une experimentation identique existe deja' }],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(fixture.componentInstance['formulaire'].get('accuracy')?.errors).toEqual({
      serveur: 'Une experimentation identique existe deja',
    });
  });
});
