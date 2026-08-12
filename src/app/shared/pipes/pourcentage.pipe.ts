import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'pourcentage', standalone: true })
export class PourcentagePipe implements PipeTransform {
  transform(valeurDecimale: number | null | undefined): string {
    if (valeurDecimale === null || valeurDecimale === undefined || Number.isNaN(valeurDecimale)) {
      return '-';
    }

    const pourcentage = valeurDecimale * 100;
    return `${pourcentage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
  }
}
