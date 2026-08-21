/**
 * Del color de marca del Taller solo se toman el MATIZ y —acotado— el croma:
 * la luminancia la pone la piel. Es el truco que el prototipo de #70 dejó
 * probado, y es lo que hace que el ajuste sea seguro: el Taller elige
 * cualquier color y no puede romper el contraste, porque el contraste depende
 * de la luminancia y esa no se negocia. No es una promesa, es una consecuencia
 * de trabajar en un espacio perceptualmente uniforme en L.
 *
 * Conversión sRGB ↔ OKLab según la formulación de Björn Ottosson.
 */

const aLineal = (c: number) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const aGamma = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

export interface Oklch {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

export function hexAOklch(hex: string): Oklch {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) =>
    aLineal(parseInt(n.slice(i, i + 2), 16) / 255),
  );

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const ll = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const aa = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    l: ll,
    c: Math.sqrt(aa * aa + bb * bb),
    h: Math.atan2(bb, aa),
  };
}

function oklchAHexCrudo({ l, c, h }: Oklch): [string, boolean] {
  const aa = c * Math.cos(h);
  const bb = c * Math.sin(h);

  const l_ = (l + 0.3963377774 * aa + 0.2158037573 * bb) ** 3;
  const m_ = (l - 0.1055613458 * aa - 0.0638541728 * bb) ** 3;
  const s_ = (l - 0.0894841775 * aa - 1.291485548 * bb) ** 3;

  const canales = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];

  const dentro = canales.every((v) => v >= -0.0001 && v <= 1.0001);
  const hex = canales
    .map((v) => {
      const byte = Math.round(Math.min(1, Math.max(0, aGamma(v))) * 255);
      return byte.toString(16).padStart(2, '0');
    })
    .join('');

  return [`#${hex}`, dentro];
}

/**
 * Devuelve el color con la luminancia y el croma máximo que pide la piel,
 * conservando el matiz del color de marca.
 *
 * Si el matiz pedido no existe en sRGB con esa luminancia y ese croma —los
 * azules saturados son el caso típico—, se baja el croma hasta que entre.
 * Bajar el croma desatura; recortar los canales, que es lo que hace el
 * navegador solo, MUEVE la luminancia, y con ella el contraste.
 */
export function derivarDeLaMarca(
  hexMarca: string,
  luminancia: number,
  cromaMaximo: number,
): string {
  const { c, h } = hexAOklch(hexMarca);
  let croma = Math.min(c, cromaMaximo);

  for (let intento = 0; intento < 64; intento++) {
    const [hex, dentro] = oklchAHexCrudo({ l: luminancia, c: croma, h });
    if (dentro || croma <= 0) return hex;
    croma -= cromaMaximo / 64;
  }

  return oklchAHexCrudo({ l: luminancia, c: 0, h })[0];
}
