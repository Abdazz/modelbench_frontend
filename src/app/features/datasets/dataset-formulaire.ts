import { Component, effect, inject, input, output, signal } from '@angular/core';
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
    description: [''],
    source: ['', [Validators.required, Validators.maxLength(255)]],
    nombreObservations: [0, [Validators.required, Validators.min(0)]],
    format: this.fb.control<FormatDataset | null>(null, Validators.required),
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        const donnees = this.donneesInitiales();
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
