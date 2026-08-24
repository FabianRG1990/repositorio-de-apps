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
