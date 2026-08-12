import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (requete, suivant) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const estAppelApi = requete.url.startsWith(environment.apiUrl);
  const estLogin = requete.url.endsWith('/auth/login');
  const jeton = auth.jeton();

  const requeteFinale =
    estAppelApi && !estLogin && jeton
      ? requete.clone({ setHeaders: { Authorization: `Bearer ${jeton}` } })
      : requete;

  return suivant(requeteFinale).pipe(
    catchError((erreur: HttpErrorResponse) => {
      if (erreur.status === 401) {
        auth.deconnecter();
        router.navigateByUrl('/connexion');
      }
      return throwError(() => erreur);
    }),
  );
};
