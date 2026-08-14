import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';

import { StatistiquesService } from '../../core/services/statistiques.service';
import { MeilleurModele, SyntheseStatistiques } from '../../core/models/statistiques.model';
import { PourcentagePipe } from '../../shared/pipes/pourcentage.pipe';

@Component({
  selector: 'app-tableau-de-bord',
  imports: [TableModule, ChartModule, PourcentagePipe, DecimalPipe],
  templateUrl: './tableau-de-bord.html',
})
export class TableauDeBord {
  private readonly service = inject(StatistiquesService);

  protected readonly synthese = signal<SyntheseStatistiques | null>(null);
  protected readonly meilleursModeles = signal<MeilleurModele[]>([]);

  protected readonly donneesGraphique = computed(() => ({
    labels: this.meilleursModeles().map((m) => m.datasetNom),
    datasets: [
      {
        label: 'Accuracy du meilleur modèle',
        data: this.meilleursModeles().map((m) => Math.round(m.accuracy * 10000) / 100),
        backgroundColor: '#33b6a9',
        borderRadius: 4,
        maxBarThickness: 42,
      },
    ],
  }));

  protected readonly optionsGraphique = {
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { callback: (v: number) => `${v}%` } },
    },
  };

  constructor() {
    this.service.synthese().subscribe((reponse) => this.synthese.set(reponse));
    this.service.meilleursModeles().subscribe((reponse) => this.meilleursModeles.set(reponse));
  }
}
