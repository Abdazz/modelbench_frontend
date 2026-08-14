import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

import { routes } from './app.routes';
import { erreurInterceptor } from './core/interceptors/erreur.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { ModelBenchPreset } from './core/theme/modelbench-preset';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([erreurInterceptor, authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: ModelBenchPreset,
        options: { darkModeSelector: '.app-dark' },
      },
    }),
    MessageService,
    ConfirmationService,
  ],
};
