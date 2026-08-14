import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { UtilisateurService } from '../../core/services/utilisateur.service';
import { RoleUtilisateur, UtilisateurAdmin } from '../../core/models/utilisateur.model';
import { ApiError } from '../../core/models/api-error.model';

const ROLES: { valeur: RoleUtilisateur; libelle: string }[] = [
  { valeur: 'ADMIN', libelle: 'Administrateur' },
  { valeur: 'CHERCHEUR', libelle: 'Chercheur' },
];

@Component({
  selector: 'app-utilisateur-formulaire',
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule, ToggleSwitchModule],
  templateUrl: './utilisateur-formulaire.html',
})
export class UtilisateurFormulaire {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(UtilisateurService);

  readonly visible = input.required<boolean>();
  readonly mode = input.required<'creation' | 'edition'>();
  readonly donneesInitiales = input<UtilisateurAdmin | null>(null);

  readonly visibleChange = output<boolean>();
  readonly sauvegarde = output<void>();

  protected readonly roles = ROLES;
  protected readonly enCours = signal(false);

  protected readonly formulaire = this.fb.nonNullable.group({
    nomComplet: ['', [Validators.required, Validators.maxLength(120)]],
    login: ['', [Validators.required, Validators.email, Validators.maxLength(60)]],
    motDePasse: [''],
    role: this.fb.control<RoleUtilisateur | null>(null, Validators.required),
    actif: [true],
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        const donnees = this.donneesInitiales();
        const modeCourant = this.mode();

        // untracked() evite que formulaire.reset() capture les signaux internes de PrimeNG
        // p-select/p-toggleswitch comme dependances de cet effect, ce qui redeclencherait un
        // reset a chaque interaction avec ces composants. Meme raisonnement que dans
        // dataset-formulaire.ts.
        untracked(() => {
          this.formulaire.reset(
            donnees
              ? {
                  nomComplet: donnees.nomComplet,
                  login: donnees.login,
                  motDePasse: '',
                  role: donnees.role,
                  actif: donnees.actif,
                }
              : { nomComplet: '', login: '', motDePasse: '', role: null, actif: true },
          );

          const controleMotDePasse = this.formulaire.get('motDePasse')!;
          controleMotDePasse.setValidators(
            modeCourant === 'creation'
              ? [Validators.required, Validators.minLength(8)]
              : [Validators.minLength(8)],
          );
          controleMotDePasse.updateValueAndValidity();
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

    const appel =
      this.mode() === 'creation'
        ? this.service.creer({
            nomComplet: valeurs.nomComplet,
            login: valeurs.login,
            motDePasse: valeurs.motDePasse,
            role: valeurs.role!,
            actif: valeurs.actif,
          })
        : this.service.modifier(this.donneesInitiales()!.id, {
            nomComplet: valeurs.nomComplet,
            login: valeurs.login,
            motDePasse: valeurs.motDePasse || null,
            role: valeurs.role!,
            actif: valeurs.actif,
          });

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
