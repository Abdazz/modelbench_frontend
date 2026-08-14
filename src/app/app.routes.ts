import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

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
      {
        path: 'experimentations',
        loadComponent: () =>
          import('./features/experimentations/experimentation-liste').then((m) => m.ExperimentationListe),
      },
      {
        path: 'utilisateurs',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/utilisateurs/utilisateur-liste').then((m) => m.UtilisateurListe),
      },
      {
        path: 'tableau-de-bord',
        loadComponent: () =>
          import('./features/tableau-de-bord/tableau-de-bord').then((m) => m.TableauDeBord),
      },
    ],
  },
];
