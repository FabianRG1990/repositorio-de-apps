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

// "FA-0001", "FA-0002"... — mismo criterio que siguienteNumeroOrden: el
// siguiente número a partir de las facturas ya existentes.
export function siguienteNumeroFactura(facturas: Factura[]): string {
  const maxActual = facturas.reduce((max, factura) => {
    const coincidencia = /^FA-(\d+)$/.exec(factura.numero);
    const numero = coincidencia ? Number(coincidencia[1]) : 0;
    return Math.max(max, numero);
  }, 0);
  return `FA-${String(maxActual + 1).padStart(4, '0')}`;
}
