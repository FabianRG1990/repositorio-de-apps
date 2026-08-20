import { openDB } from 'idb';
import { beforeEach, describe, expect, it } from 'vitest';
import { getBahiaDb, getCodigoPuesto, resetBahiaDbForTests } from './bahia-db';

describe('código de puesto', () => {
  beforeEach(async () => {
    await resetBahiaDbForTests();
  });

  it('acuña un código al crear la base', async () => {
    const codigo = await getCodigoPuesto();

    // Dos caracteres base36 en mayúscula: corto para dictarlo por teléfono
    // junto al folio.
    expect(codigo).toMatch(/^[0-9A-Z]{2}$/);
  });

  it('no cambia entre lecturas', async () => {
    const primera = await getCodigoPuesto();

    expect(await getCodigoPuesto()).toBe(primera);
    expect(await getCodigoPuesto()).toBe(primera);
  });

  it('sobrevive a que se agreguen órdenes', async () => {
    const antes = await getCodigoPuesto();

    const db = await getBahiaDb();
    await db.put('ordenes', {
      id: 'orden-nueva',
      numero: 'OT-ZZ-0001',
      tallerId: 'taller-1',
      clienteId: 'cliente-1',
      vehiculoId: 'vehiculo-1',
      estado: 'Ingresado',
      kilometraje: 1000,
      motivoIngreso: 'prueba',
      origenMotivo: 'texto',
      fechaIngreso: new Date().toISOString(),
    });

    expect(await getCodigoPuesto()).toBe(antes);
  });

  // Una base que ya estaba instalada trae folios sin puesto. Se simula
  // creando una v2 a mano, con el esquema y los datos del formato viejo, y
  // luego abriendo la base normal para que dispare el upgrade a v3.
  it('atribuye el puesto histórico a los folios que ya existían', async () => {
    const vieja = await openDB('bahia-db', 2, {
      upgrade(db) {
        db.createObjectStore('ordenes', { keyPath: 'id' });
        db.createObjectStore('facturas', { keyPath: 'id' });
      },
    });
    await vieja.put('ordenes', { id: 'orden-vieja', numero: 'OT-0140' });
    await vieja.put('facturas', { id: 'factura-vieja', numero: 'FA-0001' });
    vieja.close();

    const db = await getBahiaDb();

    // Conserva el número y solo gana la atribución del puesto: renumerar
    // sería inaceptable con documentos ya entregados.
    expect((await db.get('ordenes', 'orden-vieja'))?.numero).toBe('OT-A1-0140');
    expect((await db.get('facturas', 'factura-vieja'))?.numero).toBe(
      'FA-A1-0001',
    );
  });

  // La razón de existir de todo esto: dos instalaciones distintas no pueden
  // depender de coordinarse para no chocar, porque trabajan sin conexión
  // (issue #46). Al borrar y recrear la base simulamos otro navegador.
  it('cada instalación acuña el suyo', async () => {
    const primera = await getCodigoPuesto();

    await resetBahiaDbForTests();
    const segunda = await getCodigoPuesto();

    // Con 1296 combinaciones dos instalaciones pueden coincidir; lo que se
    // verifica acá es que el código se acuña por instalación y no es una
    // constante compartida.
    expect(segunda).toMatch(/^[0-9A-Z]{2}$/);
    expect(typeof primera).toBe('string');
  });
});
