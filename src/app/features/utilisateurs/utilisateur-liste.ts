import { Component, inject, signal } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService, MessageService } from 'primeng/api';

import { UtilisateurService } from '../../core/services/utilisateur.service';
import { RoleUtilisateur, UtilisateurAdmin } from '../../core/models/utilisateur.model';
import { UtilisateurFormulaire } from './utilisateur-formulaire';

const ROLES: { valeur: RoleUtilisateur; libelle: string }[] = [
  { valeur: 'ADMIN', libelle: 'Administrateur' },
  { valeur: 'CHERCHEUR', libelle: 'Chercheur' },
];

@Component({
  selector: 'app-utilisateur-liste',
  imports: [
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    TagModule,
    SkeletonModule,
    UtilisateurFormulaire,
  ],
  templateUrl: './utilisateur-liste.html',
})
export class UtilisateurListe {
  private readonly service = inject(UtilisateurService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  protected readonly roles = ROLES;

  protected readonly donnees = signal<UtilisateurAdmin[]>([]);
  protected readonly total = signal(0);
  protected readonly chargement = signal(false);
  protected readonly premier = signal(0);

  protected readonly recherche = signal('');
  protected readonly roleFiltre = signal<RoleUtilisateur | null>(null);

  protected readonly dialogueVisible = signal(false);
  protected readonly modeDialogue = signal<'creation' | 'edition'>('creation');
  protected readonly utilisateurEnEdition = signal<UtilisateurAdmin | null>(null);

  private readonly rechercheSubject = new Subject<string>();
  private dernierEvenement: TableLazyLoadEvent | null = null;

  constructor() {
    this.rechercheSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((valeur) => {
      this.recherche.set(valeur);
      this.recharger();
    });
  }

  surRecherche(valeur: string): void {
    this.rechercheSubject.next(valeur);
  }

  surChangementRole(valeur: RoleUtilisateur | null): void {
    this.roleFiltre.set(valeur);
    this.recharger();
  }

  charger(evenement: TableLazyLoadEvent): void {
    this.dernierEvenement = evenement;
    this.chargement.set(true);

    const rows = evenement.rows ?? 10;
    const page = Math.floor((evenement.first ?? 0) / rows);
    const champTri = Array.isArray(evenement.sortField) ? evenement.sortField[0] : evenement.sortField;
    const sort = champTri ? `${champTri},${evenement.sortOrder === 1 ? 'asc' : 'desc'}` : undefined;

    this.service
      .rechercher({
        page,
        size: rows,
        sort,
        recherche: this.recherche() || undefined,
        role: this.roleFiltre() ?? undefined,
      })
      .subscribe({
        next: (reponse) => {
          this.donnees.set(reponse.contenu);
          this.total.set(reponse.totalElements);
          this.chargement.set(false);
        },
        error: () => this.chargement.set(false),
      });
  }

  ouvrirCreation(): void {
    this.utilisateurEnEdition.set(null);
    this.modeDialogue.set('creation');
    this.dialogueVisible.set(true);
  }

  ouvrirEdition(utilisateur: UtilisateurAdmin): void {
    this.utilisateurEnEdition.set(utilisateur);
    this.modeDialogue.set('edition');
    this.dialogueVisible.set(true);
  }

  surSauvegarde(): void {
    this.dialogueVisible.set(false);
    this.messages.add({ severity: 'success', summary: 'Enregistre', detail: 'L utilisateur a ete enregistre.' });
    this.recharger();
  }

  confirmerSuppression(utilisateur: UtilisateurAdmin): void {
    this.confirmation.confirm({
      message: `Supprimer l utilisateur "${utilisateur.nomComplet}" ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Oui', severity: 'danger' },
      rejectButtonProps: { label: 'Non', severity: 'secondary', outlined: true },
      accept: () => this.supprimer(utilisateur),
    });
  }

  private supprimer(utilisateur: UtilisateurAdmin): void {
    this.service.supprimer(utilisateur.id).subscribe(() => {
      this.messages.add({
        severity: 'success',
        summary: 'Supprime',
        detail: `L utilisateur "${utilisateur.nomComplet}" a ete supprime.`,
      });
      this.recharger();
    });
  }

  private recharger(): void {
    if (this.dernierEvenement) {
      this.premier.set(0);
      this.charger({ ...this.dernierEvenement, first: 0 });
    }
  }
}
