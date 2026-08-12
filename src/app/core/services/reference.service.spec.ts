import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ReferenceService } from './reference.service';
import { environment } from '../environments/environment';

describe('ReferenceService', () => {
  let service: ReferenceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReferenceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('formatsDataset appelle GET /reference/formats-dataset', () => {
    service.formatsDataset().subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/reference/formats-dataset`);
    expect(requete.request.method).toBe('GET');
    requete.flush([{ valeur: 'CSV', libelle: 'CSV' }]);
  });

  it('typesModele appelle GET /reference/types-modele', () => {
    service.typesModele().subscribe();
    const requete = httpMock.expectOne(`${environment.apiUrl}/reference/types-modele`);
    expect(requete.request.method).toBe('GET');
    requete.flush([{ valeur: 'VISION', libelle: 'Vision' }]);
  });
});
