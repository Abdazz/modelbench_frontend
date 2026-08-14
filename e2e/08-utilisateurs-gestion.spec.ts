import { test, expect } from '@playwright/test';

test('creation d un utilisateur puis refus de l auto-suppression du compte connecte', async ({
  page,
}) => {
  await page.goto('/utilisateurs');
  await page.screenshot({ path: '../docs/captures/09-gestion-utilisateurs.png', fullPage: true });

  await page.getByRole('button', { name: 'Nouvel utilisateur' }).click();

  const dialogue = page.getByRole('dialog');
  await page.getByLabel('Nom complet').fill('E2E Utilisateur Temporaire');
  await dialogue.getByLabel('Email').fill('e2e.temporaire@example.com');
  await page.getByLabel('Mot de passe').fill('motdepasse123');
  await dialogue.getByLabel('Role').click();
  await page.getByRole('option', { name: 'Chercheur' }).click();
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page.getByText('L utilisateur a ete enregistre.')).toBeVisible();
  const ligneCreee = page.getByRole('row', { name: /E2E Utilisateur Temporaire/ });
  await expect(ligneCreee).toBeVisible();

  const ligneAdmin = page.getByRole('row', { name: /Administrateur du laboratoire/ });
  await ligneAdmin.getByRole('button', { name: 'Supprimer' }).click();
  await page.getByRole('button', { name: 'Oui' }).click();

  await expect(page.getByText(/ne peut pas se supprimer lui-meme/)).toBeVisible();
  await expect(ligneAdmin).toBeVisible();

  await ligneCreee.getByRole('button', { name: 'Supprimer' }).click();
  await page.getByRole('button', { name: 'Oui' }).click();
  await expect(page.getByText('a ete supprime.')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'E2E Utilisateur Temporaire' })).toHaveCount(0);
});
