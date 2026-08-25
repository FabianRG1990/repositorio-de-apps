import type { Orden } from '../../data-access/ordenes.store';

/**
 * Los tres montones en que se parte la lista.
 *
 * No son un adorno: la lista se revisa "cuando hay tiempo" ([ADR 0011]) y lo
 * primero que hay que poder contestar al abrirla es **a quién hay que llamar
 * hoy**. Una lista plana ordenada por fecha obliga a leerla entera para
 * averiguarlo.
 */
export type Monton = 'pasadas' | 'esta-semana' | 'mas-adelante';

export interface GrupoDeVisitas {
  readonly monton: Monton;
  readonly titulo: string;
  readonly nota: string;
  readonly visitas: readonly Orden[];
}

const TITULOS: Record<Monton, { titulo: string; nota: string }> = {
  pasadas: {
    titulo: 'Ya pasó la fecha',
    nota: 'Estos son los que hay que llamar hoy.',
  },
  'esta-semana': {
    titulo: 'En los próximos siete días',
    nota: 'Para ir apartando el espacio.',
  },
  'mas-adelante': {
    titulo: 'Más adelante',
    nota: 'Todavía no urge; está acá para que no se pierda.',
  },
};

const DIA = 86_400_000;

/**
 * Cuántos días faltan para la visita. Negativo si ya pasó.
 *
 * Se cuenta por DÍA de calendario y no por horas: una fecha de hoy a las
 * 00:00 comparada contra las 15:00 daría "hace medio día" y caería en las
 * vencidas, cuando para el Taller es hoy.
 *
 * La cadena se parte a mano en vez de `new Date(iso)`: eso la lee como
 * medianoche UTC y en Costa Rica devuelve el día anterior.
 */
export function diasParaLaVisita(iso: string, hoy: Date = new Date()): number {
  const [anno, mes, dia] = iso.split('-').map(Number);
  const cita = new Date(anno, mes - 1, dia).getTime();
  const hoyANoche = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
  ).getTime();

  return Math.round((cita - hoyANoche) / DIA);
}

/** `3` → `en 3 días`. `0` → `hoy`. `-2` → `hace 2 días`. */
export function cuandoLegible(dias: number): string {
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  if (dias === -1) return 'ayer';
  return dias > 0 ? `en ${dias} días` : `hace ${-dias} días`;
}

/**
 * Reparte las visitas en sus montones, en orden de fecha.
 *
 * Los montones vacíos no salen: una pantalla con "Ya pasó la fecha" y nada
 * debajo se lee como que algo falló, no como que el Taller va al día.
 */
export function agruparVisitas(
  visitas: readonly Orden[],
  hoy: Date = new Date(),
): readonly GrupoDeVisitas[] {
  const montones: Record<Monton, Orden[]> = {
    pasadas: [],
    'esta-semana': [],
    'mas-adelante': [],
  };

  for (const visita of visitas) {
    if (!visita.proximaVisita) continue;
    const dias = diasParaLaVisita(visita.proximaVisita, hoy);
    const monton: Monton =
      dias < 0 ? 'pasadas' : dias <= 7 ? 'esta-semana' : 'mas-adelante';
    montones[monton].push(visita);
  }

  return (Object.keys(montones) as Monton[])
    .filter((monton) => montones[monton].length > 0)
    .map((monton) => ({
      monton,
      ...TITULOS[monton],
      /* En ISO el orden alfabético ES el cronológico, que es la mitad de la
         razón por la que la fecha se guarda así. */
      visitas: montones[monton].sort((a, b) =>
        (a.proximaVisita ?? '').localeCompare(b.proximaVisita ?? ''),
      ),
    }));
}
