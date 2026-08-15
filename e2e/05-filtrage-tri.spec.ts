import { test, expect } from '@playwright/test';

test('le filtre MNIST reduit le tableau et le tri recharge depuis l API', async ({ page }) => {
  await page.goto('/datasets');
  await expect(page.getByRole('row')).toHaveCount(11); // 10 lignes de donnees (page 1) + l entete

  await page.getByLabel('Recherche globale').fill('MNIST');
  await page.waitForTimeout(400);
  await expect(page.getByRole('row')).toHaveCount(2); // 1 ligne de donnees + l entete

  await page.getByLabel('Recherche globale').fill('');
  await page.waitForTimeout(400);

  const requeteTriee = page.waitForResponse(
    (reponse) => reponse.url().includes('/api/datasets') && reponse.url().includes('sort=nom'),
  );
  await page.getByRole('columnheader', { name: 'Nom' }).click();
  await requeteTriee;

  await page.screenshot({ path: '../docs/captures/05-filtrage-tri.png', fullPage: true });
});
