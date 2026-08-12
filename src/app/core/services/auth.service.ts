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
    if (this.session()) {
      this.restaurerSession().subscribe({ error: () => this.deconnecter() });
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

  private restaurerSession(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.base}/moi`);
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
