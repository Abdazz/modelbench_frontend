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

import { ModeleMLService } from '../../core/services/modele-ml.service';
import { ReferenceService } from '../../core/services/reference.service';
import { AuthService } from '../../core/services/auth.service';
import { ModeleML, TypeModele } from '../../core/models/modele-ml.model';
import { ValeurReference } from '../../core/models/reference.model';
import { ModeleFormulaire } from './modele-formulaire';

@Component({
  selector: 'app-modele-liste',
  imports: [
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    TagModule,
    SkeletonModule,
    ModeleFormulaire,
  ],
  templateUrl: './modele-liste.html',
})
export class ModeleListe {
  private readonly service = inject(ModeleMLService);
  private readonly reference = inject(ReferenceService);
  private readonly auth = inject(AuthService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  protected readonly estAdmin = this.auth.estAdmin;

  protected readonly donnees = signal<ModeleML[]>([]);
  protected readonly total = signal(0);
  protected readonly chargement = signal(false);
  protected readonly premier = signal(0);
  protected readonly types = signal<ValeurReference[]>([]);

  protected readonly recherche = signal('');
  protected readonly typeFiltre = signal<TypeModele | null>(null);

  protected readonly dialogueVisible = signal(false);
  protected readonly modeDialogue = signal<'creation' | 'edition'>('creation');
  protected readonly modeleEnEdition = signal<ModeleML | null>(null);

  private readonly rechercheSubject = new Subject<string>();
  private dernierEvenement: TableLazyLoadEvent | null = null;

  constructor() {
    this.reference.typesModele().subscribe((valeurs) => this.types.set(valeurs));
    this.rechercheSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((valeur) => {
      this.recherche.set(valeur);
      this.recharger();
    });
  }

  surRecherche(valeur: string): void {
    this.rechercheSubject.next(valeur);
  }

  surChangementType(valeur: TypeModele | null): void {
    this.typeFiltre.set(valeur);
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
        type: this.typeFiltre() ?? undefined,
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
    this.modeleEnEdition.set(null);
    this.modeDialogue.set('creation');
    this.dialogueVisible.set(true);
  }

  ouvrirEdition(modele: ModeleML): void {
    this.modeleEnEdition.set(modele);
    this.modeDialogue.set('edition');
    this.dialogueVisible.set(true);
  }

  surSauvegarde(): void {
    this.dialogueVisible.set(false);
    this.messages.add({ severity: 'success', summary: 'Enregistre', detail: 'Le modele a ete enregistre.' });
    this.recharger();
  }

  confirmerSuppression(modele: ModeleML): void {
    this.confirmation.confirm({
      message: `Supprimer le modele "${modele.nom}" (version ${modele.version}) ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Oui', severity: 'danger' },
      rejectButtonProps: { label: 'Non', severity: 'secondary', outlined: true },
      accept: () => this.supprimer(modele),
    });
  }

  private supprimer(modele: ModeleML): void {
    this.service.supprimer(modele.id).subscribe(() => {
      this.messages.add({
        severity: 'success',
        summary: 'Supprime',
        detail: `Le modele "${modele.nom}" a ete supprime.`,
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
