// Ver issue #11 (reapertura de alcance): factura simple sin manejo de
// pagos — solo el documento en sí. Vinculada 1 a 1 con una OrdenTrabajo
// ya "Entregado"; una vez guardada, queda fija (de solo lectura), mismo
// criterio que OrdenTrabajo.diagnostico.
export interface Concepto {
  descripcion: string;
  monto: number;
}

export interface Factura {
  id: string;
  ordenId: string;
  numero: string;
  fecha: string;
  conceptos: Concepto[];
}

// El total nunca se guarda por separado — siempre se deriva de los
// conceptos, para no arrastrar un valor que podría desincronizarse.
export function totalFactura(factura: Pick<Factura, 'conceptos'>): number {
  return factura.conceptos.reduce((suma, concepto) => suma + concepto.monto, 0);
}

// "FA-A1-0001", "FA-A1-0002"... — mismo criterio que siguienteNumeroOrden: el
// número lleva el código del puesto que lo acuñó y cada puesto lleva su serie.
//
// Acá el problema del consecutivo global (issue #46) es todavía más caro que
// en las órdenes: este número identifica el documento de cobro. Dos facturas
// distintas con el mismo número no es un choque de datos, es un problema con
// el cliente y con Hacienda.
export function siguienteNumeroFactura(
  facturas: Factura[],
  codigoPuesto: string,
): string {
  const patron = new RegExp(`^FA-${codigoPuesto}-(\\d+)$`);
  const maxActual = facturas.reduce((max, factura) => {
    const coincidencia = patron.exec(factura.numero);
    const numero = coincidencia ? Number(coincidencia[1]) : 0;
    return Math.max(max, numero);
  }, 0);
  return `FA-${codigoPuesto}-${String(maxActual + 1).padStart(4, '0')}`;
}
