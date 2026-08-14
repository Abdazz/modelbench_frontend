import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../environments/environment';
import { ConnexionRequest, ConnexionResponse, Utilisateur } from '../models/auth.model';

const CLE_STOCKAGE = 'modelbench.session';

interface SessionStockee {
  token: string;
  login: string;
  nomComplet: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;

  private readonly session = signal<SessionStockee | null>(this.lireSessionStockee());

  readonly utilisateur = computed<Utilisateur | null>(() => {
    const courante = this.session();
    return courante
      ? { login: courante.login, nomComplet: courante.nomComplet, roles: courante.roles }
      : null;
  });

  readonly estConnecte = computed(() => this.session() !== null);
  readonly estAdmin = computed(() => this.session()?.roles.includes('ADMIN') ?? false);

  constructor() {
    // La revalidation est differee hors de la fenetre synchrone du constructeur : appelee ici
    // directement, elle passe par authInterceptor, qui fait inject(AuthService) alors
    // qu AuthService est encore en cours de construction. Angular detecte ce cycle reentrant et
    // leve NG0200 de maniere synchrone ; comme subscribe() ne fournit qu un gestionnaire error,
    // RxJS l avale silencieusement et deconnecter() purge la session avant meme la fin du
    // constructeur. queueMicrotask repousse l appel apres que l injection d AuthService soit
    // terminee, ce qui casse le cycle sans changer le comportement fonctionnel.
    if (this.session()) {
      queueMicrotask(() => {
        this.restaurerSession().subscribe({ error: () => this.deconnecter() });
      });
    }
  }

  jeton(): string | null {
    return this.session()?.token ?? null;
  }

  connecter(requete: ConnexionRequest): Observable<ConnexionResponse> {
    return this.http
      .post<ConnexionResponse>(`${this.base}/login`, requete)
      .pipe(tap((reponse) => this.ouvrirSession(reponse)));
  }

  deconnecter(): void {
    this.session.set(null);
    localStorage.removeItem(CLE_STOCKAGE);
  }

  restaurerSession(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.base}/moi`).pipe(
      tap((utilisateur) => this.mettreAJourSession(utilisateur)),
    );
  }

  private mettreAJourSession(utilisateur: Utilisateur): void {
    const courante = this.session();
    if (!courante) {
      return;
    }
    const misAJour: SessionStockee = {
      ...courante,
      nomComplet: utilisateur.nomComplet,
      roles: utilisateur.roles,
    };
    this.session.set(misAJour);
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(misAJour));
  }

  private ouvrirSession(reponse: ConnexionResponse): void {
    const stockee: SessionStockee = {
      token: reponse.token,
      login: reponse.login,
      nomComplet: reponse.nomComplet,
      roles: reponse.roles,
    };
    this.session.set(stockee);
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(stockee));
  }

  private lireSessionStockee(): SessionStockee | null {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (!brut) {
      return null;
    }
    try {
      return JSON.parse(brut) as SessionStockee;
    } catch {
      return null;
    }
  }
}
