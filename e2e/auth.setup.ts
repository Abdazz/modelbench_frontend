import { test as setup, expect } from '@playwright/test';

const FICHIER_ADMIN = 'e2e/.auth/admin.json';

setup('authentification admin', async ({ page }) => {
  await page.goto('/connexion');
  await page.getByLabel('Identifiant').fill('admin');
  await page.getByLabel('Mot de passe').fill('admin123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('/tableau-de-bord');
  await page.context().storageState({ path: FICHIER_ADMIN });
});
