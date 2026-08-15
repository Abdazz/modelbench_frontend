import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';

import { ExperimentationService } from '../../core/services/experimentation.service';
import { Experimentation } from '../../core/models/experimentation.model';
import { Dataset } from '../../core/models/dataset.model';
import { ModeleML } from '../../core/models/modele-ml.model';
import { ApiError } from '../../core/models/api-error.model';

function dateNonFutureValidator(controle: AbstractControl): ValidationErrors | null {
  const valeur = controle.value as Date | null;
  if (!valeur) {
    return null;
  }
  return valeur.getTime() > Date.now() ? { futur: true } : null;
}

function dureeStrictementPositiveValidator(groupe: AbstractControl): ValidationErrors | null {
  const heures = groupe.get('dureeHeures')?.value ?? 0;
  const minutes = groupe.get('dureeMinutes')?.value ?? 0;
  const secondes = groupe.get('dureeSecondes')?.value ?? 0;
  return heures * 3600 + minutes * 60 + secondes > 0 ? null : { dureeNulle: true };
}

function decomposerDureeEnSecondes(secondesTotal: number): {
  dureeHeures: number;
  dureeMinutes: number;
  dureeSecondes: number;
} {
  return {
    dureeHeures: Math.floor(secondesTotal / 3600),
    dureeMinutes: Math.floor((secondesTotal % 3600) / 60),
    dureeSecondes: Math.floor(secondesTotal % 60),
  };
}

@Component({
  selector: 'app-experimentation-formulaire',
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, SelectModule, InputNumberModule, DatePickerModule],
  templateUrl: './experimentation-formulaire.html',
})
export class ExperimentationFormulaire {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ExperimentationService);

  readonly visible = input.required<boolean>();
  readonly mode = input.required<'creation' | 'edition'>();
  readonly donneesInitiales = input<Experimentation | null>(null);
  readonly datasets = input<Dataset[]>([]);
  readonly modeles = input<ModeleML[]>([]);

  readonly visibleChange = output<boolean>();
  readonly sauvegarde = output<void>();

  protected readonly enCours = signal(false);

  protected readonly formulaire = this.fb.nonNullable.group(
    {
      datasetId: this.fb.control<number | null>(null, Validators.required),
      modeleId: this.fb.control<number | null>(null, Validators.required),
      accuracy: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(0),
        Validators.max(1),
      ]),
      f1Score: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(0),
        Validators.max(1),
      ]),
      dureeHeures: this.fb.control<number | null>(0, [Validators.required, Validators.min(0)]),
      dureeMinutes: this.fb.control<number | null>(0, [Validators.required, Validators.min(0), Validators.max(59)]),
      dureeSecondes: this.fb.control<number | null>(0, [Validators.required, Validators.min(0), Validators.max(59)]),
      dateExecution: this.fb.control<Date | null>(null, [Validators.required, dateNonFutureValidator]),
    },
    { validators: dureeStrictementPositiveValidator },
  );

  constructor() {
    effect(() => {
      if (this.visible()) {
        const donnees = this.donneesInitiales();
        // untracked() est necessaire ici : formulaire.reset() appelle de maniere synchrone
        // writeValue() sur les ControlValueAccessor de p-select (Dataset, Modele) et de
        // p-inputnumber/p-datepicker, qui lisent (et ecrivent) des signaux internes a PrimeNG.
        // Sans untracked(), ces lectures sont capturees comme dependances de cet effect (Angular
        // suit tout signal lu pendant l execution synchrone de l effect, quel que soit le
        // composant proprietaire). Une fois capturees, la moindre interaction ulterieure avec un
        // de ces champs (ouverture d un select, selection d une option) modifie ces memes signaux
        // internes et redeclenche cet effect, qui rappelle reset() et efface le formulaire que
        // l utilisateur vient de remplir. Meme cause et meme correctif que dans
        // dataset-formulaire.ts, confirmes ici par reproduction manuelle identique (selectionner
        // Dataset puis Modele effacait la selection du Dataset).
        untracked(() => {
          this.formulaire.reset(
            donnees
              ? {
                  datasetId: donnees.datasetId,
                  modeleId: donnees.modeleId,
                  accuracy: donnees.accuracy,
                  f1Score: donnees.f1Score,
                  ...decomposerDureeEnSecondes(donnees.dureeEntrainement),
                  dateExecution: new Date(donnees.dateExecution),
                }
              : {
                  datasetId: null,
                  modeleId: null,
                  accuracy: null,
                  f1Score: null,
                  dureeHeures: 0,
                  dureeMinutes: 0,
                  dureeSecondes: 0,
                  dateExecution: null,
                },
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
      datasetId: valeurs.datasetId,
      modeleId: valeurs.modeleId,
      accuracy: valeurs.accuracy,
      f1Score: valeurs.f1Score,
      dureeEntrainement: valeurs.dureeHeures! * 3600 + valeurs.dureeMinutes! * 60 + valeurs.dureeSecondes!,
      dateExecution: this.versIsoSansFuseau(valeurs.dateExecution!),
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
            const champCible = erreurChamp.champ === 'dureeEntrainement' ? 'dureeHeures' : erreurChamp.champ;
            this.formulaire.get(champCible)?.setErrors({ serveur: erreurChamp.message });
          }
        }
      },
    });
  }

  private versIsoSansFuseau(date: Date): string {
    const deuxChiffres = (valeur: number) => valeur.toString().padStart(2, '0');
    return (
      `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}` +
      `T${deuxChiffres(date.getHours())}:${deuxChiffres(date.getMinutes())}:${deuxChiffres(date.getSeconds())}`
    );
  }
}
