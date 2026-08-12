import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ModeleFormulaire } from './modele-formulaire';
import { environment } from '../../core/environments/environment';
import { ModeleML } from '../../core/models/modele-ml.model';

describe('ModeleFormulaire', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeleFormulaire],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function creer(mode: 'creation' | 'edition' = 'creation', donnees: ModeleML | null = null) {
    const fixture = TestBed.createComponent(ModeleFormulaire);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('donneesInitiales', donnees);
    fixture.componentRef.setInput('types', [{ valeur: 'VISION', libelle: 'Vision' }]);
    fixture.detectChanges();
    return fixture;
  }

  it('le formulaire est invalide quand tous les champs sont vides', () => {
    const fixture = creer();
    expect(fixture.componentInstance['formulaire'].invalid).toBe(true);
  });

  it('version au mauvais format est invalide', () => {
    const fixture = creer();
    const controle = fixture.componentInstance['formulaire'].get('version')!;
    controle.setValue('v1');
    expect(controle.invalid).toBe(true);
  });

  it('accepte les formats de version 1, 1.0 et 1.0.0', () => {
    const fixture = creer();
    const controle = fixture.componentInstance['formulaire'].get('version')!;
    controle.setValue('1');
    expect(controle.valid).toBe(true);
    controle.setValue('1.2');
    expect(controle.valid).toBe(true);
    controle.setValue('1.2.3');
    expect(controle.valid).toBe(true);
  });

  it('le formulaire est valide avec des valeurs conformes', () => {
    const fixture = creer();
    fixture.componentInstance['formulaire'].setValue({
      nom: 'ResNet-50',
      type: 'VISION',
      algorithme: 'Reseau de neurones convolutif',
      version: '1.0',
    });
    expect(fixture.componentInstance['formulaire'].valid).toBe(true);
  });

  it('pre-remplit le formulaire en mode edition', () => {
    const modele: ModeleML = {
      id: 1,
      nom: 'ResNet-50',
      type: 'VISION',
      algorithme: 'CNN',
      version: '1.0',
      dateCreation: '2026-01-01',
    };
    const fixture = creer('edition', modele);
    expect(fixture.componentInstance['formulaire'].get('version')?.value).toBe('1.0');
  });

  it('reinjecte les erreurs de validation du serveur sur les champs concernes', () => {
    const fixture = creer();
    fixture.componentInstance['formulaire'].setValue({
      nom: 'ResNet-50',
      type: 'VISION',
      algorithme: 'CNN',
      version: '1.0',
    });

    fixture.componentInstance.soumettre();

    httpMock.expectOne(`${environment.apiUrl}/modeles`).flush(
      {
        timestamp: '2026-08-12T10:00:00Z',
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'La validation a echoue',
        path: '/api/modeles',
        errors: [{ champ: 'nom', message: 'Le couple nom et version existe deja' }],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(fixture.componentInstance['formulaire'].get('nom')?.errors).toEqual({
      serveur: 'Le couple nom et version existe deja',
    });
    expect(fixture.componentInstance['enCours']()).toBe(false);
  });
});
