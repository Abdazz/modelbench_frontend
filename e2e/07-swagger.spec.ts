import { test, expect } from '@playwright/test';

test('Swagger UI liste les trois controleurs metier', async ({ page }) => {
  await page.goto('http://localhost:8090/swagger');

  // Deviation par rapport au brief : page.getByText('Datasets') est ambigu dans le DOM reel de
  // Swagger UI (le nom du controleur apparait aussi dans les liens d operation, ex.
  // '/api/datasets/{id}'), ce qui declenche une violation du mode strict de Playwright.
  // Les titres de section (balises h3, role heading) ciblent sans ambiguite le bandeau de
  // chaque controleur, dont le texte commence par le nom du tag suivi de sa description.
  await expect(page.getByRole('heading', { name: /^Datasets/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Modeles/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Experimentations/ })).toBeVisible();

  await page.screenshot({ path: '../docs/captures/07-swagger.png', fullPage: true });
});
