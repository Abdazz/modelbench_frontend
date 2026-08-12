import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { TableauDeBord } from './tableau-de-bord';
import { environment } from '../../core/environments/environment';

describe('TableauDeBord', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableauDeBord],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('charge la synthese et les meilleurs modeles au demarrage', () => {
    const fixture = TestBed.createComponent(TableauDeBord);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/statistiques/synthese`).flush({
      nbDatasets: 8,
      nbModeles: 8,
      nbExperimentations: 24,
      accuracyMoyenne: 0.86,
      meilleureExperimentation: null,
    });
    httpMock.expectOne(`${environment.apiUrl}/statistiques/meilleurs-modeles`).flush([
      { datasetId: 1, datasetNom: 'MNIST', modeleId: 1, modeleNom: 'ResNet-50', accuracy: 0.98, f1Score: 0.97 },
    ]);

    expect(fixture.componentInstance['synthese']()?.nbDatasets).toBe(8);
    expect(fixture.componentInstance['meilleursModeles']().length).toBe(1);
  });

  it('construit les donnees du graphique a partir des meilleurs modeles', () => {
    const fixture = TestBed.createComponent(TableauDeBord);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/statistiques/synthese`).flush({
      nbDatasets: 1,
      nbModeles: 1,
      nbExperimentations: 1,
      accuracyMoyenne: 0.9,
      meilleureExperimentation: null,
    });
    httpMock.expectOne(`${environment.apiUrl}/statistiques/meilleurs-modeles`).flush([
      { datasetId: 1, datasetNom: 'MNIST', modeleId: 1, modeleNom: 'ResNet-50', accuracy: 0.9864, f1Score: 0.97 },
    ]);

    const donnees = fixture.componentInstance['donneesGraphique']();
    expect(donnees.labels).toEqual(['MNIST']);
    expect(donnees.datasets[0].data).toEqual([98.64]);
  });
});
