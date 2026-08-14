import { vi } from 'vitest';

// Les composants de formulaire (PrimeNG p-select, date pickers, etc.) compilent un arbre de
// directives assez lourd pour que le delai par defaut de 5000ms soit parfois depasse sous charge
// machine, sans que le test lui-meme soit en cause. Un testTimeout depuis un fichier de config
// Vitest charge par ce builder (runnerConfig) n a aucun effet ici : passer par l API imperative
// vi.setConfig au demarrage du fichier de setup est l unique reglage qui soit reellement pris en
// compte par ce builder.
vi.setConfig({ testTimeout: 15000 });

// Node 22+ expose un global localStorage/sessionStorage experimental (API Web Storage native),
// mais celui-ci reste une coquille vide sans methodes tant que --localstorage-file n'est pas
// fourni. Vitest ne redefinit un global existant vers son equivalent jsdom que si ce nom figure
// dans sa liste figee de cles connues (voir populateGlobal dans vitest/dist/chunks/index.*.js) ;
// cette liste ne contient pas encore localStorage/sessionStorage. Le global casse de Node prend
// donc le pas sur celui, fonctionnel, de jsdom. On rebranche ici explicitement les vraies
// implementations jsdom, exposees par Vitest via globalThis.jsdom.
const dom = (globalThis as unknown as { jsdom?: { window: Window } }).jsdom;

if (dom) {
  Object.defineProperty(globalThis, 'localStorage', {
    get: () => dom.window.localStorage,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    get: () => dom.window.sessionStorage,
    configurable: true,
  });
}
