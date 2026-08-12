import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

import { ApiError } from '../models/api-error.model';

export const erreurInterceptor: HttpInterceptorFn = (requete, suivant) => {
  const messages = inject(MessageService);

  return suivant(requete).pipe(
    catchError((erreur: HttpErrorResponse) => {
      if (erreur.status === 0) {
        messages.add({
          severity: 'error',
          summary: 'Serveur injoignable',
          detail: 'Le serveur est injoignable, verifiez qu il tourne sur le port 8090.',
          life: 6000,
        });
        return throwError(() => erreur);
      }

      const corps = erreur.error as ApiError | null;
      messages.add({
        severity: 'error',
        summary: corps?.code ?? 'Erreur',
        detail: corps?.message ?? 'Une erreur inattendue est survenue.',
        life: 6000,
      });

      return throwError(() => erreur);
    }),
  );
};
