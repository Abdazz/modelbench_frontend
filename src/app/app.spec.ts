import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

import { App } from './app';

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

  it('n affiche pas la sidebar quand l utilisateur n est pas connecte', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('aside')).toBeNull();
    expect(compiled.querySelector('p-drawer')).toBeNull();
  });

  it('affiche 5 entrees de menu, dont Utilisateurs, pour un role ADMIN', () => {
    localStorage.setItem(
      'modelbench.session',
      JSON.stringify({ token: 't', login: 'admin@example.com', nomComplet: 'Administrateur', roles: ['ADMIN'] }),
    );
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const elements = fixture.componentInstance['elementsMenu']();
    expect(elements.length).toBe(5);
    expect(elements.some((e) => e.label === 'Utilisateurs')).toBe(true);
  });

  it('affiche 4 entrees de menu, sans Utilisateurs, pour un role CHERCHEUR', () => {
    localStorage.setItem(
      'modelbench.session',
      JSON.stringify({ token: 't', login: 'chercheur@example.com', nomComplet: 'Chercheur', roles: ['CHERCHEUR'] }),
    );
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const elements = fixture.componentInstance['elementsMenu']();
    expect(elements.length).toBe(4);
    expect(elements.some((e) => e.label === 'Utilisateurs')).toBe(false);
  });

  it('basculerSidebar inverse le mode reduit de la sidebar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance['sidebarReduite']()).toBe(false);
    fixture.componentInstance.basculerSidebar();
    expect(fixture.componentInstance['sidebarReduite']()).toBe(true);
    fixture.componentInstance.basculerSidebar();
    expect(fixture.componentInstance['sidebarReduite']()).toBe(false);
  });

  it('basculerMenuMobile inverse la visibilite du drawer mobile', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance['menuMobileOuvert']()).toBe(false);
    fixture.componentInstance.basculerMenuMobile();
    expect(fixture.componentInstance['menuMobileOuvert']()).toBe(true);
    fixture.componentInstance.basculerMenuMobile();
    expect(fixture.componentInstance['menuMobileOuvert']()).toBe(false);
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
