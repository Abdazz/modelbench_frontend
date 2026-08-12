import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuItem } from 'primeng/api';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MenubarModule, ButtonModule, ToastModule, ConfirmDialogModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly auth = inject(AuthService);

  protected readonly estConnecte = this.auth.estConnecte;
  protected readonly utilisateur = this.auth.utilisateur;

  protected readonly sombre = signal(false);

  protected readonly elementsMenu = computed<MenuItem[]>(() => [
    { label: 'Tableau de bord', icon: 'pi pi-home', routerLink: '/tableau-de-bord' },
    { label: 'Datasets', icon: 'pi pi-database', routerLink: '/datasets' },
    { label: 'Modeles', icon: 'pi pi-share-alt', routerLink: '/modeles' },
    { label: 'Experimentations', icon: 'pi pi-chart-line', routerLink: '/experimentations' },
  ]);

  basculerTheme(): void {
    this.sombre.update((valeur) => !valeur);
    document.documentElement.classList.toggle('app-dark', this.sombre());
  }

  deconnecter(): void {
    this.auth.deconnecter();
  }
}
