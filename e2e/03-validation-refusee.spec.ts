import { test, expect } from '@playwright/test';

test('accuracy = 1.5 bloque la soumission et affiche l erreur sous le champ', async ({ page }) => {
  await page.goto('/experimentations');
  await page.getByRole('button', { name: 'Nouvelle experimentation' }).click();

  await page.getByLabel('Accuracy').fill('1.5');
  await page.getByLabel('Accuracy').blur();

  await expect(page.getByText('L accuracy doit etre comprise entre 0 et 1.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
  await page.screenshot({ path: '../docs/captures/03-erreurs-validation.png', fullPage: true });
});
