import type { Orden } from '../../data-access/ordenes.store';
import { agruparVisitas, cuandoLegible, diasParaLaVisita } from './agenda';

/* Al agrupador solo le importan la fecha y el orden: el resto de la Orden se
   rellena con lo mínimo que el tipo exige. */
const visita = (proximaVisita: string): Orden =>
  ({ id: proximaVisita, proximaVisita }) as unknown as Orden;

const HOY = new Date(2026, 7, 25); // 25 de agosto de 2026, hora local

describe('cuántos días faltan', () => {
  it('cuenta los días que faltan', () => {
    expect(diasParaLaVisita('2026-08-28', HOY)).toBe(3);
  });

  it('lo que ya pasó cuenta en negativo', () => {
    expect(diasParaLaVisita('2026-08-20', HOY)).toBe(-5);
  });

  /* Se cuenta por DÍA de calendario y no por horas: comparando instantes, una
     cita de hoy a medianoche contra las tres de la tarde daría "hace medio
     día" y caería en las vencidas, cuando para el Taller es hoy. */
  it('hoy es cero a cualquier hora', () => {
    const tarde = new Date(2026, 7, 25, 15, 40);

    expect(diasParaLaVisita('2026-08-25', tarde)).toBe(0);
  });

  /* Un cambio de horario de verano mete una hora de más o de menos en el
     intervalo, y dividir entre 86 400 000 sin redondear la perdería. Costa
     Rica no lo usa, pero el navegador se lleva el huso del aparato. */
  it('un cambio de horario no corre la cuenta', () => {
    const antes = new Date(2026, 2, 5);

    expect(diasParaLaVisita('2026-03-12', antes)).toBe(7);
  });
});

describe('cómo se dice', () => {
  it('hoy, mañana y ayer se dicen con su nombre', () => {
    expect(cuandoLegible(0)).toBe('hoy');
    expect(cuandoLegible(1)).toBe('mañana');
    expect(cuandoLegible(-1)).toBe('ayer');
  });

  it('el resto va en días', () => {
    expect(cuandoLegible(4)).toBe('en 4 días');
    expect(cuandoLegible(-6)).toBe('hace 6 días');
  });
});

describe('los montones', () => {
  it('parte en pasadas, esta semana y más adelante', () => {
    const grupos = agruparVisitas(
      [visita('2026-09-30'), visita('2026-08-20'), visita('2026-08-27')],
      HOY,
    );

    expect(grupos.map((g) => g.monton)).toEqual([
      'pasadas',
      'esta-semana',
      'mas-adelante',
    ]);
  });

  /* La de hoy es una llamada de hoy, no una vencida: el Cliente todavía puede
     traer el carro esta tarde. */
  it('la de hoy va en esta semana', () => {
    const grupos = agruparVisitas([visita('2026-08-25')], HOY);

    expect(grupos[0].monton).toBe('esta-semana');
  });

  it('el séptimo día todavía es esta semana; el octavo ya no', () => {
    const grupos = agruparVisitas(
      [visita('2026-09-01'), visita('2026-09-02')],
      HOY,
    );

    expect(grupos.map((g) => g.monton)).toEqual([
      'esta-semana',
      'mas-adelante',
    ]);
  });

  it('dentro de cada montón van por fecha', () => {
    const grupos = agruparVisitas(
      [visita('2026-08-29'), visita('2026-08-26')],
      HOY,
    );

    expect(grupos[0].visitas.map((v) => v.proximaVisita)).toEqual([
      '2026-08-26',
      '2026-08-29',
    ]);
  });

  /* Un "Ya pasó la fecha" con nada debajo se lee como que algo falló, no como
     que el Taller va al día. */
  it('los montones vacíos no salen', () => {
    const grupos = agruparVisitas([visita('2026-08-26')], HOY);

    expect(grupos).toHaveLength(1);
  });

  it('sin visitas no hay montones', () => {
    expect(agruparVisitas([], HOY)).toEqual([]);
  });
});
