import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { ModeleMLService } from '../../core/services/modele-ml.service';
import { ModeleML, TypeModele } from '../../core/models/modele-ml.model';
import { ValeurReference } from '../../core/models/reference.model';
import { ApiError } from '../../core/models/api-error.model';

const MOTIF_VERSION = /^\d+(\.\d+){0,2}$/;

@Component({
  selector: 'app-modele-formulaire',
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './modele-formulaire.html',
})
export class ModeleFormulaire {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ModeleMLService);

  readonly visible = input.required<boolean>();
  readonly mode = input.required<'creation' | 'edition'>();
  readonly donneesInitiales = input<ModeleML | null>(null);
  readonly types = input<ValeurReference[]>([]);

  readonly visibleChange = output<boolean>();
  readonly sauvegarde = output<void>();

  protected readonly enCours = signal(false);

  protected readonly formulaire = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    type: this.fb.control<TypeModele | null>(null, Validators.required),
    algorithme: ['', [Validators.required, Validators.maxLength(120)]],
    version: ['', [Validators.required, Validators.pattern(MOTIF_VERSION)]],
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        const donnees = this.donneesInitiales();
        this.formulaire.reset(
          donnees
            ? {
                nom: donnees.nom,
                type: donnees.type,
                algorithme: donnees.algorithme,
                version: donnees.version,
              }
            : { nom: '', type: null, algorithme: '', version: '' },
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
    const requete = this.formulaire.getRawValue();

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
