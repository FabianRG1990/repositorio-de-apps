import { derivarDeLaMarca, hexAOklch } from './color-marca';

describe('color de marca', () => {
  /* La promesa del ajuste: el Taller elige cualquier color y no puede romper
     el contraste, porque de la marca solo se toma el matiz y la claridad la
     pone la piel. Si esta prueba cae, el ajuste dejó de ser seguro. */
  it('devuelve la luminancia pedida sea cual sea el color de marca', () => {
    const marcas = [
      '#3da5c2',
      '#ffff00',
      '#000000',
      '#ffffff',
      '#ff0000',
      '#0000ff',
      '#7cfc00',
      '#808080',
    ];

    for (const objetivo of [0.42, 0.63, 0.8]) {
      for (const marca of marcas) {
        const derivado = derivarDeLaMarca(marca, objetivo, 0.1);
        expect(hexAOklch(derivado).l).toBeCloseTo(objetivo, 1);
      }
    }
  });

  it('conserva el matiz de la marca', () => {
    const marca = '#c23d5a';
    const enGrados = (radianes: number) => (radianes * 180) / Math.PI;
    const matizPedido = enGrados(hexAOklch(marca).h);
    const matizObtenido = enGrados(
      hexAOklch(derivarDeLaMarca(marca, 0.63, 0.1)).h,
    );

    /* La tolerancia va en GRADOS porque es lo que se puede juzgar: un grado de
       matiz no lo distingue nadie. El desvío real es de ~0,4° y no sale del
       cálculo —el matiz se pasa intacto— sino de redondear a 8 bits por canal
       al escribir el hexadecimal. */
    expect(Math.abs(matizObtenido - matizPedido)).toBeLessThan(1);
  });

  it('no se pasa del croma que le fija la piel', () => {
    // Un rojo saturadísimo no puede colarse con su croma original.
    const derivado = derivarDeLaMarca('#ff0000', 0.63, 0.05);

    expect(hexAOklch(derivado).c).toBeLessThanOrEqual(0.0501);
  });

  it('sobrevive a un color sin matiz', () => {
    // Negro y blanco no tienen matiz: el resultado tiene que ser un gris de la
    // luminancia pedida, no un NaN ni un color desbocado.
    for (const acromatico of ['#000000', '#ffffff']) {
      const derivado = derivarDeLaMarca(acromatico, 0.63, 0.1);

      expect(derivado).toMatch(/^#[0-9a-f]{6}$/);
      expect(hexAOklch(derivado).l).toBeCloseTo(0.63, 1);
    }
  });
});
