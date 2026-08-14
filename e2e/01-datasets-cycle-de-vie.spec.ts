import { test, expect } from '@playwright/test';

test('cycle de vie complet d un dataset : creer, voir, editer, supprimer', async ({ page }) => {
  await page.goto('/datasets');
  await page.screenshot({ path: '../docs/captures/01-datasets-liste.png', fullPage: true });

  await page.getByRole('button', { name: 'Nouveau dataset' }).click();
  await page.screenshot({ path: '../docs/captures/02-dialogue-creation.png', fullPage: true });

  // Le select "Format" du dialogue partage le mot "format" avec le select de filtrage de la
  // page sous-jacente (toujours present dans le DOM derriere le modal) : on scope la recherche
  // au dialogue pour lever l ambiguite plutot que d utiliser exact:true, qui echouerait aussi
  // (le nom accessible reel du select vient de son placeholder "Choisir un format", pas du
  // texte "Format" du <label>).
  const dialogue = page.getByRole('dialog');
  await page.getByLabel('Nom', { exact: true }).fill('E2E Dataset Temporaire');
  await page.getByLabel('Source').fill('Suite Playwright');
  await page.getByLabel('Nombre d\'observations').fill('100');
  await dialogue.getByLabel('Format').click();
  await page.getByRole('option', { name: 'CSV' }).click();
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page.getByText('Le dataset a été enregistré.')).toBeVisible();
  const ligne = page.getByRole('row', { name: /E2E Dataset Temporaire/ });
  await expect(ligne).toBeVisible();

  await ligne.getByRole('button', { name: 'Modifier' }).click();
  await page.getByLabel('Source').fill('Suite Playwright modifiee');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Le dataset a été enregistré.')).toBeVisible();

  await ligne.getByRole('button', { name: 'Supprimer' }).click();
  await page.getByRole('button', { name: 'Oui' }).click();
  await expect(page.getByText('a été supprimé.')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'E2E Dataset Temporaire' })).toHaveCount(0);
});
