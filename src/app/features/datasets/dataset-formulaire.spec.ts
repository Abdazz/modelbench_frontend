import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { DatasetFormulaire } from './dataset-formulaire';
import { environment } from '../../core/environments/environment';
import { Dataset } from '../../core/models/dataset.model';

describe('DatasetFormulaire', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetFormulaire],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function creer(mode: 'creation' | 'edition' = 'creation', donnees: Dataset | null = null) {
    const fixture = TestBed.createComponent(DatasetFormulaire);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('donneesInitiales', donnees);
    fixture.componentRef.setInput('formats', [{ valeur: 'CSV', libelle: 'CSV' }]);
    fixture.detectChanges();
    return fixture;
  }

  it('le formulaire est invalide quand tous les champs sont vides', () => {
    const fixture = creer();
    expect(fixture.componentInstance['formulaire'].invalid).toBe(true);
  });

  it('nom trop court est invalide', () => {
    const fixture = creer();
    const controle = fixture.componentInstance['formulaire'].get('nom')!;
    controle.setValue('A');
    expect(controle.invalid).toBe(true);
  });

  it('nombreObservations negatif est invalide', () => {
    const fixture = creer();
    const controle = fixture.componentInstance['formulaire'].get('nombreObservations')!;
    controle.setValue(-1);
    expect(controle.invalid).toBe(true);
  });

  it('le formulaire est valide avec des valeurs conformes', () => {
    const fixture = creer();
    fixture.componentInstance['formulaire'].setValue({
      nom: 'MNIST',
      description: '',
      source: 'Kaggle',
      nombreObservations: 70000,
      format: 'IMAGES',
    });
    expect(fixture.componentInstance['formulaire'].valid).toBe(true);
  });

  it('pre-remplit le formulaire en mode edition', () => {
    const dataset: Dataset = {
      id: 1,
      nom: 'MNIST',
      description: 'Chiffres',
      source: 'Kaggle',
      nombreObservations: 70000,
      format: 'IMAGES',
      dateAjout: '2026-01-01',
    };
    const fixture = creer('edition', dataset);
    expect(fixture.componentInstance['formulaire'].get('nom')?.value).toBe('MNIST');
  });

  it('reinjecte les erreurs de validation du serveur sur les champs concernes', () => {
    const fixture = creer();
    fixture.componentInstance['formulaire'].setValue({
      nom: 'MNIST',
      description: '',
      source: 'Kaggle',
      nombreObservations: 70000,
      format: 'IMAGES',
    });

    fixture.componentInstance.soumettre();

    httpMock.expectOne(`${environment.apiUrl}/datasets`).flush(
      {
        timestamp: '2026-08-12T10:00:00Z',
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'La validation a echoue',
        path: '/api/datasets',
        errors: [{ champ: 'nom', message: 'Le nom est deja utilise' }],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(fixture.componentInstance['formulaire'].get('nom')?.errors).toEqual({
      serveur: 'Le nom est deja utilise',
    });
  });
});
