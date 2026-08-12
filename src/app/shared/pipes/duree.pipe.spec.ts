import { DureePipe } from './duree.pipe';

describe('DureePipe', () => {
  const pipe = new DureePipe();

  it('formate 7245 secondes en 2h 00m 45s (exemple de la spec)', () => {
    expect(pipe.transform(7245)).toBe('2h 00m 45s');
  });

  it('formate 0 seconde en 0h 00m 00s', () => {
    expect(pipe.transform(0)).toBe('0h 00m 00s');
  });

  it('formate exactement une heure en 1h 00m 00s', () => {
    expect(pipe.transform(3600)).toBe('1h 00m 00s');
  });

  it('renvoie un tiret pour une valeur nulle ou indefinie', () => {
    expect(pipe.transform(null)).toBe('-');
    expect(pipe.transform(undefined)).toBe('-');
  });
});
