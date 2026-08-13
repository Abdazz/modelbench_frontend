import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { AuthService } from '../../core/services/auth.service';
import { ApiError } from '../../core/models/api-error.model';

@Component({
  selector: 'app-connexion',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, MessageModule, IconFieldModule, InputIconModule],
  templateUrl: './connexion.html',
})
export class Connexion {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly formulaire = this.fb.nonNullable.group({
    login: ['', Validators.required],
    motDePasse: ['', Validators.required],
  });

  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  soumettre(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.enCours.set(true);
    this.erreur.set(null);

    this.auth.connecter(this.formulaire.getRawValue()).subscribe({
      next: () => {
        this.enCours.set(false);
        this.router.navigateByUrl('/');
      },
      error: (e: HttpErrorResponse) => {
        this.enCours.set(false);
        const corps = e.error as ApiError | null;
        this.erreur.set(corps?.message ?? 'Connexion impossible.');
      },
    });
  }
}
