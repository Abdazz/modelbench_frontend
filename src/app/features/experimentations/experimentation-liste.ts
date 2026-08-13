import { Component, inject, signal } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ExperimentationService } from '../../core/services/experimentation.service';
import { DatasetService } from '../../core/services/dataset.service';
import { ModeleMLService } from '../../core/services/modele-ml.service';
import { AuthService } from '../../core/services/auth.service';
import { Experimentation } from '../../core/models/experimentation.model';
import { Dataset } from '../../core/models/dataset.model';
import { ModeleML } from '../../core/models/modele-ml.model';
import { DureePipe } from '../../shared/pipes/duree.pipe';
import { PourcentagePipe } from '../../shared/pipes/pourcentage.pipe';
import { ExperimentationFormulaire } from './experimentation-formulaire';

@Component({
  selector: 'app-experimentation-liste',
  imports: [
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    InputNumberModule,
    SkeletonModule,
    DureePipe,
    PourcentagePipe,
    ExperimentationFormulaire,
  ],
  templateUrl: './experimentation-liste.html',
})
export class ExperimentationListe {
  private readonly service = inject(ExperimentationService);
  private readonly datasetService = inject(DatasetService);
  private readonly modeleService = inject(ModeleMLService);
  private readonly auth = inject(AuthService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  protected readonly estAdmin = this.auth.estAdmin;

  protected readonly donnees = signal<Experimentation[]>([]);
  protected readonly total = signal(0);
  protected readonly chargement = signal(false);
  protected readonly premier = signal(0);
  protected readonly datasets = signal<Dataset[]>([]);
  protected readonly modeles = signal<ModeleML[]>([]);

  protected readonly recherche = signal('');
  protected readonly datasetIdFiltre = signal<number | undefined>(undefined);
  protected readonly modeleIdFiltre = signal<number | undefined>(undefined);
  protected readonly accuracyMinFiltre = signal<number | undefined>(undefined);
  protected readonly accuracyMaxFiltre = signal<number | undefined>(undefined);

  protected readonly dialogueVisible = signal(false);
  protected readonly modeDialogue = signal<'creation' | 'edition'>('creation');
  protected readonly experimentationEnEdition = signal<Experimentation | null>(null);

  private readonly rechercheSubject = new Subject<string>();
  private dernierEvenement: TableLazyLoadEvent | null = null;

  constructor() {
    this.datasetService
      .rechercher({ page: 0, size: 1000, sort: 'nom,asc' })
      .subscribe((reponse) => this.datasets.set(reponse.contenu));
    this.modeleService
      .rechercher({ page: 0, size: 1000, sort: 'nom,asc' })
      .subscribe((reponse) => this.modeles.set(reponse.contenu));
    this.rechercheSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((valeur) => {
      this.recherche.set(valeur);
      this.recharger();
    });
  }

  surRecherche(valeur: string): void {
    this.rechercheSubject.next(valeur);
  }

  surChangementDataset(valeur: number | undefined): void {
    this.datasetIdFiltre.set(valeur);
    this.recharger();
  }

  surChangementModele(valeur: number | undefined): void {
    this.modeleIdFiltre.set(valeur);
    this.recharger();
  }

  surAccuracyMin(valeur: number | null): void {
    this.accuracyMinFiltre.set(valeur ?? undefined);
    this.recharger();
  }

  surAccuracyMax(valeur: number | null): void {
    this.accuracyMaxFiltre.set(valeur ?? undefined);
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
        datasetId: this.datasetIdFiltre(),
        modeleId: this.modeleIdFiltre(),
        accuracyMin: this.accuracyMinFiltre(),
        accuracyMax: this.accuracyMaxFiltre(),
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
    this.experimentationEnEdition.set(null);
    this.modeDialogue.set('creation');
    this.dialogueVisible.set(true);
  }

  ouvrirEdition(experimentation: Experimentation): void {
    this.experimentationEnEdition.set(experimentation);
    this.modeDialogue.set('edition');
    this.dialogueVisible.set(true);
  }

  surSauvegarde(): void {
    this.dialogueVisible.set(false);
    this.messages.add({
      severity: 'success',
      summary: 'Enregistre',
      detail: 'L experimentation a ete enregistree.',
    });
    this.recharger();
  }

  confirmerSuppression(experimentation: Experimentation): void {
    this.confirmation.confirm({
      message: `Supprimer cette experimentation (${experimentation.datasetNom} / ${experimentation.modeleNom}) ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Oui', severity: 'danger' },
      rejectButtonProps: { label: 'Non', severity: 'secondary', outlined: true },
      accept: () => this.supprimer(experimentation),
    });
  }

  private supprimer(experimentation: Experimentation): void {
    this.service.supprimer(experimentation.id).subscribe(() => {
      this.messages.add({
        severity: 'success',
        summary: 'Supprime',
        detail: 'L experimentation a ete supprimee.',
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
