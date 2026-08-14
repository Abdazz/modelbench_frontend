# ModelBench, frontend

Interface Angular pour la gestion de jeux de donnees, de modeles de Machine Learning et
d'experimentations. Devoir de Master Intelligence Artificielle, Developpement Full-Stack, 2026/2027.

Ce depot est le frontend seul. Le backend (`modelbench/`, Spring Boot) est un depot Git separe et
doit tourner en parallele : voir son propre `README.md` pour l'installer et le lancer.

## Comptes de demonstration

| Login | Mot de passe | Role | Droits |
|---|---|---|---|
| `admin@example.com` | `admin123` | ADMIN | Lecture et ecriture |
| `chercheur@example.com` | `chercheur123` | CHERCHEUR | Lecture seule |

Ils sont aussi affiches directement sur la page de connexion de l'application.

## Prerequis

- Node.js 20 ou superieur et npm
- Le backend `modelbench` demarre sur `http://localhost:8090` (profil `h2` recommande pour un
  demarrage sans base a installer, voir son README) ; sans lui, la page de connexion affiche « Le
  serveur est injoignable, verifiez qu il tourne sur le port 8090. »

## Installation

```bash
npm install
```

## Lancement

```bash
npm start
```

Sert l'application sur `http://localhost:4200`.

## Lancer les tests unitaires

```bash
npm test
```

Tests Vitest : services HTTP (via `HttpTestingController`), validation des formulaires reactifs,
pipes. Aucune dependance sur un backend demarre.

## Lancer les tests de bout en bout

```bash
npm run e2e
```

Playwright demarre automatiquement le backend (profil `h2`) et `ng serve`, execute les scenarios de
bout en bout et produit des captures d'ecran dans `../docs/captures/`. Commande distincte de
`npm test` : un evaluateur presse n'est jamais bloque par l'installation d'un navigateur.

## Build de production

```bash
npm run build
```

## Configuration

L'URL de base de l'API est codee dans `src/app/core/environments/environment.ts`
(`http://localhost:8090/api` par defaut). La modifier si le backend tourne sur une autre adresse.

## Arborescence

```
src/app/
  app.ts, app.html             coquille : p-menubar + <router-outlet> + p-toast + p-confirmdialog
  app.config.ts, app.routes.ts
  core/
    models/                    miroir TypeScript des DTO Java
    services/                  un service HttpClient par entite (dataset, modele-ml,
                               experimentation, reference, statistiques, auth, utilisateur)
    interceptors/               erreur.interceptor.ts, auth.interceptor.ts
    guards/                    auth.guard.ts, admin.guard.ts
    environments/               environment.ts (apiUrl)
  features/
    auth/                      connexion.ts
    datasets/                  dataset-liste.ts, dataset-formulaire.ts
    modeles/                   modele-liste.ts, modele-formulaire.ts
    experimentations/           experimentation-liste.ts, experimentation-formulaire.ts
    utilisateurs/               utilisateur-liste.ts, utilisateur-formulaire.ts
    tableau-de-bord/           tableau-de-bord.ts
  shared/pipes/                duree.pipe.ts, pourcentage.pipe.ts
e2e/                           scenarios Playwright
```

## Architecture

Composants standalone et zoneless (defaut Angular 21), etat local en signals. Un `p-table` en mode
`lazy` par entite : pagination, tri et filtrage executes cote serveur, jamais en memoire. Un
intercepteur HTTP traduit chaque erreur `ApiError` du backend en notification `p-toast` ; les
erreurs de validation de champ sont en plus reinjectees dans le `FormGroup` concerne. Un second
intercepteur attache le jeton JWT a chaque appel `/api/**` et deconnecte l'utilisateur sur un 401.
Les routes fonctionnelles sont protegees par un garde d'authentification ; l'adaptation a l'aide de
`estAdmin()` masque les boutons d'ecriture pour le role `CHERCHEUR` plutot que de bloquer des routes,
le backend revalidant de toute facon chaque operation d'ecriture cote serveur.

La route `/utilisateurs`, elle, est en plus protegee par un garde `adminGuard` : contrairement aux
trois autres entites, la gestion des comptes n'est pas seulement masquee cote UI pour un role
CHERCHEUR, elle est routee en dehors de son atteinte, le backend refusant de toute facon la
ressource `/api/utilisateurs` a quiconque n'est pas ADMIN, y compris en lecture.
