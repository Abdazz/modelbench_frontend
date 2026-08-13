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

  it('description de plus de 2000 caracteres est invalide', () => {
    const fixture = creer();
    const controle = fixture.componentInstance['formulaire'].get('description')!;
    controle.setValue('a'.repeat(2001));
    expect(controle.invalid).toBe(true);
    expect(controle.errors?.['maxlength']).toBeTruthy();
  });

  it('description de 2000 caracteres exactement est valide', () => {
    const fixture = creer();
    const controle = fixture.componentInstance['formulaire'].get('description')!;
    controle.setValue('a'.repeat(2000));
    expect(controle.invalid).toBe(false);
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

  it('changer le format apres avoir rempli les autres champs ne reinitialise pas le formulaire', () => {
    // Note de couverture : le bug reel (voir dataset-formulaire.ts) se declenchait via des
    // signaux internes de PrimeNG p-select lus pendant formulaire.reset(), qui ne sont notifies
    // que par une vraie interaction navigateur avec le panneau CDK Overlay (ouverture du select,
    // clic sur une option). Une reproduction avec de vrais evenements DOM a ete tentee ici mais
    // n a pas pu reproduire fidelement le mecanisme meme apres avoir contourne l absence de
    // window.matchMedia dans jsdom : le panneau CDK Overlay ne notifie pas les memes signaux
    // internes dans cet environnement que dans un vrai navigateur. La couverture fidele au
    // mecanisme reel vit dans e2e/01-datasets-cycle-de-vie.spec.ts (Playwright, vrai Chromium),
    // qui remplit le formulaire puis choisit une option Format via de vrais clics. Ce test-ci
    // couvre neanmoins une regression valide et directement liee : que modifier le controle
    // format (via le meme chemin ControlValueAccessor.writeValue() que la selection reelle)
    // n efface pas les autres champs deja remplis.
    const fixture = creer();
    const formulaire = fixture.componentInstance['formulaire'];
    formulaire.get('nom')?.setValue('Mon dataset');
    formulaire.get('source')?.setValue('Ma source');
    formulaire.get('nombreObservations')?.setValue(42);

    formulaire.get('format')?.setValue('CSV');
    fixture.detectChanges();

    expect(formulaire.get('nom')?.value).toBe('Mon dataset');
    expect(formulaire.get('source')?.value).toBe('Ma source');
    expect(formulaire.get('nombreObservations')?.value).toBe(42);
    expect(formulaire.get('format')?.value).toBe('CSV');
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

  it('reinjecte l erreur serveur sur description et l affiche dans le gabarit', () => {
    // La description est volontairement valide cote client (le validateur maxLength(2000)
    // laisse donc passer soumettre()) : ce test couvre le cas defensif ou le serveur refuse
    // quand meme la description (regle serveur plus stricte, ecart d encodage, etc.), pour
    // s assurer que ce refus reste visible a l utilisateur et ne bloque pas silencieusement
    // le bouton Enregistrer sans explication.
    const fixture = creer();
    fixture.componentInstance['formulaire'].setValue({
      nom: 'MNIST',
      description: 'Une description valide cote client',
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
        errors: [{ champ: 'description', message: 'La description ne doit pas depasser 2000 caracteres' }],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    const controle = fixture.componentInstance['formulaire'].get('description');
    expect(controle?.errors).toEqual({ serveur: 'La description ne doit pas depasser 2000 caracteres' });

    controle?.markAsTouched();
    fixture.detectChanges();
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('La description ne doit pas depasser 2000 caracteres');
  });
});
