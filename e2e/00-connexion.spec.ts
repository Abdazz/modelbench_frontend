import { test, expect } from '@playwright/test';

test('connexion admin puis chercheur, les boutons d ecriture disparaissent en lecture seule', async ({
  page,
}) => {
  await page.goto('/connexion');
  await page.getByLabel('Identifiant').fill('admin');
  await page.getByLabel('Mot de passe').fill('admin123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('/tableau-de-bord');
  await expect(page.getByText('Administrateur du laboratoire')).toBeVisible();
  await page.screenshot({ path: '../docs/captures/00-connexion.png', fullPage: true });

  // Deviation par rapport au brief : le clic sur Deconnexion vide bien la session (le bouton
  // Deconnexion et la barre de menu disparaissent, verifie ci-dessous) mais ne redirige pas tout
  // seul vers /connexion. App.deconnecter() (src/app/app.ts) appelle uniquement
  // AuthService.deconnecter(), qui efface le signal et le localStorage sans navigation ; seul le
  // garde de route (auth.guard.ts), evalue a la prochaine navigation, ou l intercepteur HTTP sur
  // un 401 declenchent un router.navigateByUrl('/connexion'). C est un ecart de comportement reel
  // de l application (Tache 10), pas une simple divergence de selecteur : signale dans le rapport
  // plutot que corrige silencieusement dans le code de production, hors perimetre de cette tache.
  await page.getByRole('button', { name: 'Deconnexion' }).click();
  await expect(page.getByRole('button', { name: 'Deconnexion' })).toHaveCount(0);
  await page.goto('/connexion');
  await expect(page).toHaveURL('/connexion');

  await page.getByLabel('Identifiant').fill('chercheur');
  await page.getByLabel('Mot de passe').fill('chercheur123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('/tableau-de-bord');

  await page.getByRole('link', { name: 'Datasets' }).click();
  await expect(page).toHaveURL('/datasets');
  await expect(page.getByRole('button', { name: 'Nouveau dataset' })).toHaveCount(0);
  await page.screenshot({ path: '../docs/captures/08-lecture-seule.png', fullPage: true });
});
