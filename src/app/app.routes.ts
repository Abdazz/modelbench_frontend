import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'connexion',
    loadComponent: () => import('./features/auth/connexion').then((m) => m.Connexion),
  },
  {
    path: '',
    children: [],
  },
];
