import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

import { DatasetService } from '../../core/services/dataset.service';
import { Dataset, FormatDataset } from '../../core/models/dataset.model';
import { ValeurReference } from '../../core/models/reference.model';
import { ApiError } from '../../core/models/api-error.model';

@Component({
  selector: 'app-dataset-formulaire',
  imports: [
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
  ],
  templateUrl: './dataset-formulaire.html',
})
export class DatasetFormulaire {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(DatasetService);

  readonly visible = input.required<boolean>();
  readonly mode = input.required<'creation' | 'edition'>();
  readonly donneesInitiales = input<Dataset | null>(null);
  readonly formats = input<ValeurReference[]>([]);

  readonly visibleChange = output<boolean>();
  readonly sauvegarde = output<void>();

  protected readonly enCours = signal(false);

  protected readonly formulaire = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(2000)]],
    source: ['', [Validators.required, Validators.maxLength(255)]],
    nombreObservations: [0, [Validators.required, Validators.min(0)]],
    format: this.fb.control<FormatDataset | null>(null, Validators.required),
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        const donnees = this.donneesInitiales();
        // untracked() est necessaire ici : formulaire.reset() appelle de maniere synchrone
        // writeValue() sur les ControlValueAccessor de p-select/p-inputnumber, qui lisent (et
        // ecrivent) des signaux internes a PrimeNG. Sans untracked(), ces lectures sont capturees
        // comme dependances de cet effect (Angular suit tout signal lu pendant l execution
        // synchrone de l effect, quel que soit le composant proprietaire). Une fois capturees, la
        // moindre interaction ulterieure avec le select Format (ouverture, selection d une option)
        // modifie ces memes signaux internes et redeclenche cet effect, qui rappelle reset() et
        // efface le formulaire que l utilisateur vient de remplir. untracked() isole reset() de ce
        // suivi de dependances sans changer quand l effect doit reellement se redeclencher (a
        // savoir : quand visible() ou donneesInitiales() changent reellement).
        untracked(() => {
          this.formulaire.reset(
            donnees
              ? {
                  nom: donnees.nom,
                  description: donnees.description ?? '',
                  source: donnees.source,
                  nombreObservations: donnees.nombreObservations,
                  format: donnees.format,
                }
              : { nom: '', description: '', source: '', nombreObservations: 0, format: null },
          );
        });
      }
    });
  }

  fermer(): void {
    this.visibleChange.emit(false);
  }

  soumettre(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.enCours.set(true);
    const valeurs = this.formulaire.getRawValue();
    const requete = {
      nom: valeurs.nom,
      description: valeurs.description || null,
      source: valeurs.source,
      nombreObservations: valeurs.nombreObservations,
      format: valeurs.format,
    };

    const appel =
      this.mode() === 'creation'
        ? this.service.creer(requete)
        : this.service.modifier(this.donneesInitiales()!.id, requete);

    appel.subscribe({
      next: () => {
        this.enCours.set(false);
        this.sauvegarde.emit();
      },
      error: (e: HttpErrorResponse) => {
        this.enCours.set(false);
        const corps = e.error as ApiError | null;
        if (corps?.code === 'VALIDATION_ERROR' && corps.errors) {
          for (const erreurChamp of corps.errors) {
            this.formulaire.get(erreurChamp.champ)?.setErrors({ serveur: erreurChamp.message });
          }
        }
      },
    });
  }
}
