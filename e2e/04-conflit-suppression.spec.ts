import { test, expect } from '@playwright/test';

test('supprimer un dataset reference declenche le toast d erreur metier 409', async ({ page }) => {
  await page.goto('/datasets');
  await page.getByLabel('Recherche globale').fill('Titanic');
  await page.waitForTimeout(400);

  const ligne = page.getByRole('row', { name: /Titanic/ });
  await ligne.getByRole('button', { name: 'Supprimer' }).click();
  await page.getByRole('button', { name: 'Oui' }).click();

  await expect(page.getByText(/est utilisé par \d+ expérimentation/)).toBeVisible();
  await page.screenshot({ path: '../docs/captures/04-conflit-suppression.png', fullPage: true });

  await expect(ligne).toBeVisible();
});
