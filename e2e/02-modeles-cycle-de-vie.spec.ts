import { test, expect } from '@playwright/test';

test('cycle de vie complet d un modele : creer avec selection reelle du type, editer, supprimer', async ({
  page,
}) => {
  await page.goto('/modeles');

  await page.getByRole('button', { name: 'Nouveau modèle' }).click();

  const dialogue = page.getByRole('dialog');
  await page.getByLabel('Nom').fill('E2E Modele Temporaire');
  await page.getByLabel('Algorithme').fill('Suite Playwright');
  await page.getByLabel('Version').fill('1.0');

  // Selection reelle d une option du p-select Type (formControlName="type") via un vrai clic sur
  // un role="option" : c est ce chemin, et lui seul, qui declenche le ControlValueAccessor
  // .writeValue() reel de PrimeNG (ouverture du panneau CDK Overlay puis selection), exactement le
  // mecanisme du bug corrige par untracked() dans modele-formulaire.ts (voir le rapport, "Bug 2").
  // Sans untracked(), cette selection redeclenche l effect() du composant, qui rappelle
  // formulaire.reset() et efface Nom/Algorithme/Version deja saisis, en plus de remettre Type a
  // null. Un simple controle.setValue() direct sur le FormControl ne passe jamais par ce chemin et
  // ne peut donc pas detecter une regression ici : seule une interaction navigateur reelle le peut.
  await dialogue.getByLabel('Type').click();
  await page.getByRole('option', { name: 'Classification' }).click();

  // Preuve que la selection de Type n a pas efface les autres champs deja remplis.
  await expect(page.getByLabel('Nom')).toHaveValue('E2E Modele Temporaire');
  await expect(page.getByLabel('Algorithme')).toHaveValue('Suite Playwright');
  await expect(page.getByLabel('Version')).toHaveValue('1.0');
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();

  await page.getByRole('button', { name: 'Enregistrer' }).click();
  // .last() : le toast de creation peut encore etre a l ecran quand celui de l edition apparait
  // (duree d affichage par defaut de p-toast), auquel cas deux toasts identiques coexistent.
  await expect(page.getByText('Le modèle a été enregistré.').last()).toBeVisible();

  const ligne = page.getByRole('row', { name: /E2E Modele Temporaire/ });
  await expect(ligne).toBeVisible();

  await ligne.getByRole('button', { name: 'Modifier' }).click();
  await page.getByLabel('Algorithme').fill('Suite Playwright modifiee');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Le modèle a été enregistré.').last()).toBeVisible();

  await ligne.getByRole('button', { name: 'Supprimer' }).click();
  await page.getByRole('button', { name: 'Oui' }).click();
  await expect(page.getByText('a été supprimé.')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'E2E Modele Temporaire' })).toHaveCount(0);
});
