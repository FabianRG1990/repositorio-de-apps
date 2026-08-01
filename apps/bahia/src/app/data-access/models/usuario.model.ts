// Permisos modelados de forma "agnóstica de rol" (ver ticket "Autenticación
// para la demo"): cada Usuario trae su propio conjunto, no se derivan de un
// puesto/cargo fijo. `facturar`, `asignar_bahia` y `ver_reportes` no tienen
// todavía ningún punto de la UI que los consulte — quedan modelados para
// cuando existan esas pantallas.
export type Permiso =
  | 'recibir'
  | 'diagnosticar'
  | 'facturar'
  | 'asignar_bahia'
  | 'ver_reportes';

export interface Usuario {
  id: string;
  tallerId: string;
  nombre: string;
  // Etiqueta descriptiva para el selector de login — no determina permisos.
  puesto: string;
  permisos: Permiso[];
}
