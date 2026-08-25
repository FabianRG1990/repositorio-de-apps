import { colones, fechaLarga, kilometros } from './formato';

describe('los montos', () => {
  /* El separador de miles de Costa Rica es el espacio fino (U+202F), no la
     coma ni el punto: por eso se compara con expresión regular. */
  it('llevan el separador de acá', () => {
    expect(colones(145000)).toMatch(/^₡145\s000$/u);
  });

  it('sin miles no llevan separador', () => {
    expect(colones(800)).toBe('₡800');
  });
});

describe('el odómetro', () => {
  it('se lee con su unidad', () => {
    expect(kilometros(148320)).toMatch(/^148\s320 km$/u);
  });
});

describe('la fecha larga', () => {
  it('escribe el mes en letras', () => {
    expect(fechaLarga('2026-12-01')).toBe('1 de diciembre de 2026');
  });

  /* `new Date('2026-12-01')` interpreta la cadena como medianoche UTC, y en
     Costa Rica (UTC-6) eso cae el 30 de noviembre. El carro volvería un día
     antes de lo que dice la Orden. */
  it('no se corre un día por la zona horaria', () => {
    expect(fechaLarga('2026-01-01')).toBe('1 de enero de 2026');
    expect(fechaLarga('2026-03-31')).toBe('31 de marzo de 2026');
  });

  it('lo que no es una fecha se devuelve tal cual', () => {
    expect(fechaLarga('')).toBe('');
  });
});
