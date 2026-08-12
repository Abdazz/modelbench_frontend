import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'duree', standalone: true })
export class DureePipe implements PipeTransform {
  transform(secondesTotal: number | null | undefined): string {
    if (secondesTotal === null || secondesTotal === undefined || Number.isNaN(secondesTotal)) {
      return '-';
    }

    const heures = Math.floor(secondesTotal / 3600);
    const minutes = Math.floor((secondesTotal % 3600) / 60);
    const secondes = Math.floor(secondesTotal % 60);

    const deuxChiffres = (valeur: number) => valeur.toString().padStart(2, '0');

    return `${heures}h ${deuxChiffres(minutes)}m ${deuxChiffres(secondes)}s`;
  }
}
