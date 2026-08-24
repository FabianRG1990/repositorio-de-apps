import type {
  CuandoPasa,
  CuartosDeTanque,
  Especialidad,
  SenalDeFalla,
} from './db/esquema';

/**
 * Cómo se leen las claves del Reporte.
 *
 * Viven acá y no en la pantalla que las captura porque hay dos sitios que las
 * enseñan —la Recepción mientras se recogen y el panel de detalle después— y
 * una misma señal escrita de dos formas distintas en la misma app se lee como
 * dos cosas distintas.
 *
 * Son presentación, no dominio: cambiar "Vibración" por "Tiembla" no es una
 * migración de las bases locales, y por eso la clave guardada nunca cambia.
 */
export const ETIQUETA_CUANDO: Record<CuandoPasa, string> = {
  'al-frenar': 'Al frenar',
  'al-arrancar': 'Al arrancar',
  'en-frio': 'En frío',
  'al-acelerar': 'Al acelerar',
  'al-girar': 'Al girar',
  'a-velocidad': 'En carretera',
  siempre: 'Siempre',
};

export const ETIQUETA_SENAL: Record<SenalDeFalla, string> = {
  ruido: 'Ruido',
  vibracion: 'Vibración',
  olor: 'Olor',
  humo: 'Humo',
  'luz-tablero': 'Luz en el tablero',
  fuga: 'Fuga',
  'no-enciende': 'No enciende',
  'se-apaga': 'Se apaga',
  'tira-agua': 'Entra agua',
  'golpe-visible': 'Golpe',
};

export const ETIQUETA_ESPECIALIDAD_REPORTE: Record<Especialidad, string> = {
  mecanica: 'Mecánica',
  electricidad: 'Electricidad',
  pintura: 'Pintura',
};

/* Cuartos de tanque, que es lo que la aguja permite leer: nadie mira el
   tablero y dice "31 %". */
export const ETIQUETA_TANQUE: Record<CuartosDeTanque, string> = {
  0: 'Vacío',
  1: '¼',
  2: '½',
  3: '¾',
  4: 'Lleno',
};

export function tanqueLegible(cuartos: CuartosDeTanque | null): string {
  return cuartos === null ? 'Sin anotar' : ETIQUETA_TANQUE[cuartos];
}

/** `["ruido","vibracion"]` → `"Ruido · Vibración"`. */
export function listar<C extends string>(
  etiquetas: Record<C, string>,
  claves: readonly C[],
): string {
  return claves.map((c) => etiquetas[c] ?? c).join(' · ');
}
