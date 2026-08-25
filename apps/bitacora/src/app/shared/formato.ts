/**
 * `145000` → `₡145 000`.
 *
 * `toLocaleString('es-CR')` y no una plantilla a mano: el separador de miles
 * de Costa Rica es el espacio fino, no la coma ni el punto, y escribirlo a
 * mano en cada pantalla es donde empiezan a salir montos con formatos
 * distintos en la misma vista.
 */
export function colones(monto: number): string {
  return `₡${monto.toLocaleString('es-CR')}`;
}

/** `148320` → `148 320 km`. El odómetro se lee, no se calcula. */
export function kilometros(km: number): string {
  return `${km.toLocaleString('es-CR')} km`;
}

/**
 * `2026-12-01` → `1 de diciembre de 2026`.
 *
 * La Próxima visita se escribe en un `<input type="date">`, que se guarda
 * siempre en ISO pero se **enseña** en el formato del aparato: en una tableta
 * puesta en inglés dice `mm/dd/yyyy`, y en Costa Rica se lee dd/mm. Un
 * 01/12 que uno entiende como diciembre y otro como enero es un carro que
 * vuelve once meses tarde. Escrito con el mes en letras no hay dos lecturas.
 *
 * Se parte la cadena a mano en vez de `new Date(iso)`: eso la interpreta como
 * medianoche UTC y en Costa Rica (UTC-6) devuelve el día anterior.
 */
export function fechaLarga(iso: string): string {
  const [anno, mes, dia] = iso.split('-').map(Number);
  if (!anno || !mes || !dia) return iso;

  return new Date(anno, mes - 1, dia).toLocaleDateString('es-CR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
