import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { erreurInterceptor } from './erreur.interceptor';

describe('erreurInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let messages: MessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erreurInterceptor])),
        provideHttpClientTesting(),
        MessageService,
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    messages = TestBed.inject(MessageService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('affiche un toast avec le message du serveur sur une erreur 409', () => {
    const ajout = vi.spyOn(messages, 'add');

    http.delete('http://localhost:8090/api/datasets/1').subscribe({ error: () => {} });

    httpMock.expectOne('http://localhost:8090/api/datasets/1').flush(
      {
        timestamp: '2026-08-12T10:00:00Z',
        status: 409,
        code: 'RESOURCE_IN_USE',
        message: 'Ce dataset est utilise par 3 experimentation(s)',
        path: '/api/datasets/1',
        errors: null,
      },
      { status: 409, statusText: 'Conflict' },
    );

    expect(ajout).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'RESOURCE_IN_USE',
        detail: 'Ce dataset est utilise par 3 experimentation(s)',
      }),
    );
  });

  it('affiche un message specifique sur un statut 0 (serveur injoignable)', () => {
    const ajout = vi.spyOn(messages, 'add');

    http.get('http://localhost:8090/api/datasets').subscribe({ error: () => {} });

    httpMock
      .expectOne('http://localhost:8090/api/datasets')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(ajout).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Serveur injoignable' }),
    );
  });

  it('laisse la reponse d erreur continuer a se propager', () => {
    let erreurRecue: unknown;
    http.get('http://localhost:8090/api/datasets/9').subscribe({
      error: (e) => (erreurRecue = e),
    });

    httpMock.expectOne('http://localhost:8090/api/datasets/9').flush(
      { code: 'RESOURCE_NOT_FOUND', message: 'Introuvable' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(erreurRecue).toBeTruthy();
  });
});
