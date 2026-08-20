import { describe, expect, it } from 'vitest';
import { Factura, siguienteNumeroFactura, totalFactura } from './factura.model';

function factura(numero: string): Factura {
  return {
    id: crypto.randomUUID(),
    ordenId: 'orden-1',
    numero,
    fecha: '2026-08-19T10:00:00',
    conceptos: [{ descripcion: 'Mano de obra', monto: 25000 }],
  };
}

describe('siguienteNumeroFactura', () => {
  it('arranca en 0001 cuando el puesto no ha facturado', () => {
    expect(siguienteNumeroFactura([], 'A1')).toBe('FA-A1-0001');
  });

  it('continúa la serie del puesto', () => {
    const facturas = [factura('FA-A1-0001'), factura('FA-A1-0002')];

    expect(siguienteNumeroFactura(facturas, 'A1')).toBe('FA-A1-0003');
  });

  // Este es el caso caro de #46: dos facturas distintas con el mismo número no
  // es un choque de datos, es un problema con el cliente y con Hacienda.
  it('no colisiona con facturas de otro puesto', () => {
    const facturas = [factura('FA-A1-0001'), factura('FA-A1-0002')];

    const enOtroPuesto = siguienteNumeroFactura(facturas, 'B7');

    expect(enOtroPuesto).toBe('FA-B7-0001');
    expect(facturas.some((f) => f.numero === enOtroPuesto)).toBe(false);
  });

  it('dos puestos que parten del mismo estado acuñan números distintos', () => {
    const compartidas = [factura('FA-A1-0001')];

    expect(siguienteNumeroFactura(compartidas, 'A1')).not.toBe(
      siguienteNumeroFactura(compartidas, 'B7'),
    );
  });
});

describe('totalFactura', () => {
  it('suma los conceptos', () => {
    const suma = totalFactura({
      conceptos: [
        { descripcion: 'Mano de obra', monto: 25000 },
        { descripcion: 'Repuestos', monto: 40500 },
      ],
    });

    expect(suma).toBe(65500);
  });

  it('es cero sin conceptos', () => {
    expect(totalFactura({ conceptos: [] })).toBe(0);
  });
});
