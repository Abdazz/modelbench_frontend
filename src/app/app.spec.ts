import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

import { App } from './app';

// jsdom ne fournit pas window.matchMedia : PrimeNG Menubar l'utilise pour son
// mode responsive (bindMatchMediaListener). Ce polyfill minimal permet le
// rendu du composant dans l'environnement de test.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'connexion', children: [] }]),
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('n affiche pas le menubar quand l utilisateur n est pas connecte', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p-menubar')).toBeNull();
  });

  it('affiche le menubar avec 4 entrees quand l utilisateur est connecte', () => {
    localStorage.setItem(
      'modelbench.session',
      JSON.stringify({ token: 't', login: 'admin', nomComplet: 'Administrateur', roles: ['ADMIN'] }),
    );
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance['elementsMenu']().length).toBe(4);
  });

  it('basculerTheme applique la classe app-dark sur le document', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.basculerTheme();
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
    fixture.componentInstance.basculerTheme();
    expect(document.documentElement.classList.contains('app-dark')).toBe(false);
  });

  it('deconnecter purge la session et redirige vers /connexion', () => {
    localStorage.setItem(
      'modelbench.session',
      JSON.stringify({ token: 't', login: 'admin', nomComplet: 'Administrateur', roles: ['ADMIN'] }),
    );
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigation = vi.spyOn(router, 'navigateByUrl');

    fixture.componentInstance.deconnecter();

    expect(fixture.componentInstance['estConnecte']()).toBe(false);
    expect(navigation).toHaveBeenCalledWith('/connexion');
  });
});
