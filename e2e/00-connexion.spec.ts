import { test, expect } from '@playwright/test';

test('connexion admin puis chercheur, les boutons d ecriture disparaissent en lecture seule', async ({
  page,
}) => {
  await page.goto('/connexion');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Mot de passe').fill('admin123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('/tableau-de-bord');
  await expect(page.getByText('Administrateur du laboratoire')).toBeVisible();
  await page.screenshot({ path: '../docs/captures/00-connexion.png', fullPage: true });

  await page.getByRole('button', { name: 'Deconnexion' }).click();
  await expect(page).toHaveURL('/connexion');

  await page.getByLabel('Email').fill('chercheur@example.com');
  await page.getByLabel('Mot de passe').fill('chercheur123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('/tableau-de-bord');

  await page.getByRole('link', { name: 'Datasets' }).click();
  await expect(page).toHaveURL('/datasets');
  await expect(page.getByRole('button', { name: 'Nouveau dataset' })).toHaveCount(0);
  await page.screenshot({ path: '../docs/captures/08-lecture-seule.png', fullPage: true });
});
