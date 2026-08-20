import { describe, expect, it } from 'vitest';
import { OrdenTrabajo, siguienteNumeroOrden } from './orden-trabajo.model';

function orden(numero: string): OrdenTrabajo {
  return {
    id: crypto.randomUUID(),
    numero,
    tallerId: 'taller-1',
    clienteId: 'cliente-1',
    vehiculoId: 'vehiculo-1',
    estado: 'Ingresado',
    kilometraje: 1000,
    motivoIngreso: 'prueba',
    origenMotivo: 'texto',
    fechaIngreso: '2026-08-19T10:00:00',
  };
}

describe('siguienteNumeroOrden', () => {
  it('arranca en 0001 cuando el puesto no tiene órdenes', () => {
    expect(siguienteNumeroOrden([], 'A1')).toBe('OT-A1-0001');
  });

  it('continúa la serie del puesto', () => {
    const ordenes = [orden('OT-A1-0140'), orden('OT-A1-0141')];

    expect(siguienteNumeroOrden(ordenes, 'A1')).toBe('OT-A1-0142');
  });

  // El bug de #46: antes esto miraba TODAS las órdenes locales, así que dos
  // puestos sin conexión veían el mismo máximo y acuñaban el mismo folio.
  // Ahora cada puesto lleva su propia serie y no pueden chocar aunque nunca
  // se hayan visto.
  it('no colisiona con folios de otro puesto', () => {
    const ordenes = [orden('OT-A1-0140'), orden('OT-A1-0141')];

    const enOtroPuesto = siguienteNumeroOrden(ordenes, 'B7');

    expect(enOtroPuesto).toBe('OT-B7-0001');
    expect(ordenes.some((o) => o.numero === enOtroPuesto)).toBe(false);
  });

  it('dos puestos que parten del mismo estado acuñan folios distintos', () => {
    const compartidas = [orden('OT-A1-0140')];

    const desdeA1 = siguienteNumeroOrden(compartidas, 'A1');
    const desdeB7 = siguienteNumeroOrden(compartidas, 'B7');

    expect(desdeA1).not.toBe(desdeB7);
  });

  it('ignora folios con formato ajeno en vez de romperse', () => {
    const ordenes = [orden('OT-A1-0140'), orden('sin-formato')];

    expect(siguienteNumeroOrden(ordenes, 'A1')).toBe('OT-A1-0141');
  });
});
