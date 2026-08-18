// Permisos modelados de forma "agnóstica de rol" (ver ticket "Autenticación
// para la demo"): cada Usuario trae su propio conjunto, no se derivan de un
// puesto/cargo fijo.
export type Permiso = 'recibir' | 'diagnosticar' | 'facturar' | 'ver_reportes';

export const PERMISO_LABEL: Record<Permiso, string> = {
  recibir: 'Recibir',
  diagnosticar: 'Diagnosticar',
  facturar: 'Facturar',
  ver_reportes: 'Ver reportes',
};

export interface Usuario {
  id: string;
  tallerId: string;
  nombre: string;
  // Etiqueta descriptiva para el selector de login — no determina permisos.
  puesto: string;
  permisos: Permiso[];
}
