import { test, expect } from '@playwright/test';

test('accuracy = 1.5 bloque la soumission et affiche l erreur sous le champ', async ({ page }) => {
  await page.goto('/experimentations');
  await page.getByRole('button', { name: 'Nouvelle expérimentation' }).click();

  await page.getByLabel('Accuracy').fill('1.5');
  await page.getByLabel('Accuracy').blur();

  await expect(page.getByText('L\'accuracy doit être comprise entre 0 et 1.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
  await page.screenshot({ path: '../docs/captures/03-erreurs-validation.png', fullPage: true });
});

test('changer le select Modele ne reinitialise pas la selection Dataset deja faite', async ({ page }) => {
  await page.goto('/experimentations');
  await page.getByRole('button', { name: 'Nouvelle expérimentation' }).click();

  const dialogue = page.getByRole('dialog');

  // Une fois une option choisie, le p-select PrimeNG affiche le libelle de cette option comme son
  // propre nom accessible (au lieu du texte du <label> "Dataset"/"Modele" qui reste associe dans
  // le DOM mais n est plus repris dans le nom accessible calcule) : getByLabel ne peut donc plus
  // les retrouver une fois une valeur selectionnee. On les cible par leur id (inputId="datasetId"
  // / "modeleId" dans experimentation-formulaire.html), stable avant et apres selection.
  const selectDataset = dialogue.locator('#datasetId');
  const selectModele = dialogue.locator('#modeleId');

  // Selection reelle d une option du p-select Dataset, puis d une option du p-select Modele, via
  // de vrais clics sur des role="option" (ouverture du panneau CDK Overlay puis selection) : c est
  // ce chemin, et lui seul, qui declenche le ControlValueAccessor.writeValue() reel de PrimeNG,
  // exactement le mecanisme du bug corrige par untracked() dans experimentation-formulaire.ts (voir
  // le rapport, "Bug 2"). Sans untracked(), la selection du Modele redeclenche l effect() du
  // composant, qui rappelle formulaire.reset() et efface la selection du Dataset deja faite. Un
  // simple controle.setValue() direct sur le FormControl ne passe jamais par ce chemin et ne peut
  // donc pas detecter une regression ici : seule une interaction navigateur reelle le peut.
  await selectDataset.click();
  await page.getByRole('option', { name: 'Titanic' }).click();

  await selectModele.click();
  await page.getByRole('option', { name: 'XGBoost' }).click();

  // Preuve que la selection du Dataset, faite avant celle du Modele, n a pas ete effacee.
  await expect(selectDataset).toContainText('Titanic');
  await expect(selectModele).toContainText('XGBoost');
  await expect(page.getByText('Le dataset est obligatoire.')).toHaveCount(0);
});
