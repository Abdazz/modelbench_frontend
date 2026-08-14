import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuItem } from 'primeng/api';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    DrawerModule,
    TooltipModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly estConnecte = this.auth.estConnecte;
  protected readonly utilisateur = this.auth.utilisateur;

  protected readonly sombre = signal(false);
  protected readonly sidebarReduite = signal(false);
  protected readonly menuMobileOuvert = signal(false);

  protected readonly decalageSidebar = computed(() => {
    if (!this.estConnecte()) {
      return '';
    }
    return this.sidebarReduite() ? 'lg:ml-[72px]' : 'lg:ml-60';
  });

  protected readonly elementsMenu = computed<MenuItem[]>(() => {
    const elements: MenuItem[] = [
      { label: 'Tableau de bord', icon: 'pi pi-home', routerLink: '/tableau-de-bord' },
      { label: 'Datasets', icon: 'pi pi-database', routerLink: '/datasets' },
      { label: 'Modèles', icon: 'pi pi-share-alt', routerLink: '/modeles' },
      { label: 'Expérimentations', icon: 'pi pi-chart-line', routerLink: '/experimentations' },
    ];
    if (this.auth.estAdmin()) {
      elements.push({ label: 'Utilisateurs', icon: 'pi pi-users', routerLink: '/utilisateurs' });
    }
    return elements;
  });

  basculerTheme(): void {
    this.sombre.update((valeur) => !valeur);
    document.documentElement.classList.toggle('app-dark', this.sombre());
  }

  basculerSidebar(): void {
    this.sidebarReduite.update((valeur) => !valeur);
  }

  basculerMenuMobile(): void {
    this.menuMobileOuvert.update((valeur) => !valeur);
  }

  deconnecter(): void {
    // Meme schema que authInterceptor (auth.interceptor.ts) sur un 401 : purge de la session puis
    // navigation explicite vers /connexion, plutot que de laisser AuthService.deconnecter() gerer
    // la navigation lui-meme (il reste ainsi focalise sur le seul etat de session).
    this.auth.deconnecter();
    this.router.navigateByUrl('/connexion');
  }
}
