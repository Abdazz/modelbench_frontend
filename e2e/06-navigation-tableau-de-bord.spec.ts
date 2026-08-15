import { test, expect } from '@playwright/test';

test('navigation entre les quatre sections et indicateurs du tableau de bord', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/tableau-de-bord');

  await page.getByRole('link', { name: 'Datasets' }).click();
  await expect(page).toHaveURL('/datasets');

  await page.getByRole('link', { name: 'Modèles' }).click();
  await expect(page).toHaveURL('/modeles');

  await page.getByRole('link', { name: 'Expérimentations' }).click();
  await expect(page).toHaveURL('/experimentations');

  await page.getByRole('link', { name: 'Tableau de bord' }).click();
  await expect(page).toHaveURL('/tableau-de-bord');

  await expect(page.getByText('18', { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: '../docs/captures/06-tableau-de-bord.png', fullPage: true });
});
