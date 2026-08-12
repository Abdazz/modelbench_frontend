import { PourcentagePipe } from './pourcentage.pipe';

describe('PourcentagePipe', () => {
  const pipe = new PourcentagePipe();

  it('formate 0.98 en 98,00 %', () => {
    expect(pipe.transform(0.98)).toBe('98,00 %');
  });

  it('formate 0.9864 en 98,64 %', () => {
    expect(pipe.transform(0.9864)).toBe('98,64 %');
  });

  it('formate 0 en 0,00 %', () => {
    expect(pipe.transform(0)).toBe('0,00 %');
  });

  it('renvoie un tiret pour une valeur nulle ou indefinie', () => {
    expect(pipe.transform(null)).toBe('-');
    expect(pipe.transform(undefined)).toBe('-');
  });
});
