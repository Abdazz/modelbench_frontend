import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'connexion',
    loadComponent: () => import('./features/auth/connexion').then((m) => m.Connexion),
  },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
      {
        path: 'datasets',
        loadComponent: () => import('./features/datasets/dataset-liste').then((m) => m.DatasetListe),
      },
      {
        path: 'modeles',
        loadComponent: () => import('./features/modeles/modele-liste').then((m) => m.ModeleListe),
      },
    ],
  },
];
