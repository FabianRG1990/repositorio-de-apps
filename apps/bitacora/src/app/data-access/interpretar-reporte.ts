import type { CuandoPasa, Especialidad, SenalDeFalla } from './db/esquema';

/**
 * Lo que el sistema entendió de una queja, y por qué lo entendió.
 *
 * `porque` no es adorno: es la única razón por la que una sugerencia
 * automática se puede confiar. Una etiqueta que aparece sin explicación
 * obliga a quien recibe a decidir entre creerle a ciegas o ignorarla siempre,
 * y las dos salidas son malas. Diciendo «porque dijo "no prende"» la
 * sugerencia se juzga en un segundo.
 */
export interface Interpretacion {
  readonly senales: readonly SenalDeFalla[];
  readonly cuando: readonly CuandoPasa[];
  /** `null` cuando no hay evidencia suficiente. No se adivina. */
  readonly especialidad: Especialidad | null;
  /** Las palabras del Cliente que dispararon cada conclusión, tal como las dijo. */
  readonly porque: readonly string[];
  /** Un título corto para la ficha, armado con lo reconocido. */
  readonly titulo: string;
}

/**
 * Normaliza para comparar, nunca para guardar.
 *
 * Se quitan las tildes porque nadie dicta acentuado de forma consistente y
 * porque el motor devuelve "frenó" donde el Cliente dijo "freno". El texto
 * que se guarda sigue siendo el original: esto solo alimenta la comparación.
 *
 * **La longitud se conserva.** En español, descomponer y quitar los signos
 * combinantes devuelve un carácter por carácter, así que las posiciones del
 * texto normalizado sirven para recortar el original. Es lo que permite citar
 * las palabras del Cliente en vez de la entrada del diccionario.
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escapar(frase: string): string {
  return frase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * La expresión que busca una frase como palabras completas.
 *
 * Los límites `\b` a los dos lados son lo que evita el falso positivo caro:
 * sin el de la izquierda, "aro" acierta dentro de "claro"; sin el de la
 * derecha —o con un `\w*` suelto— acierta dentro de "aroma", y "marcha"
 * dentro de "marchamo", que en Costa Rica sale en toda conversación de
 * taller.
 *
 * El sufijo es una lista corta de terminaciones y no `\w*` por lo mismo: hay
 * que cubrir el plural y el gerundio —"faja"→"fajas", "frena"→"frenando"— sin
 * abrir la puerta a cualquier palabra que empiece igual.
 *
 * Entre palabras va `\s+` para que dos espacios seguidos no rompan la frase.
 */
const SUFIJO = '(?:s|es|n|en|ndo|do|da|dos|das|ba|ban|mos)?';

function patron(frase: string): RegExp {
  const palabras = frase.split(' ').map(escapar).join('\\s+');
  return new RegExp(`\\b${palabras}${SUFIJO}\\b`, 'u');
}

/**
 * Palabras que niegan lo que viene detrás.
 *
 * "No hace ruido" no es una queja de ruido, y sin esto lo sería. La ventana
 * es de dos palabras porque el español pega la negación al verbo; más lejos
 * empieza a negar cosas que no le tocan.
 */
const NEGACIONES = ['no', 'nunca', 'tampoco', 'sin'];

function estaNegada(texto: string, desde: number): boolean {
  const antes = texto.slice(Math.max(0, desde - 24), desde);
  const palabras = antes.trim().split(/\s+/).slice(-2);
  return palabras.some((p) => NEGACIONES.includes(p));
}

interface Regla<T> {
  readonly clave: T;
  readonly frases: readonly string[];
  /**
   * La frase YA es negativa: "no enciende" es la señal, no su negación. Sin
   * esta marca, el filtro de negación borraría justo las quejas más claras.
   */
  readonly esNegativa?: boolean;
}

/* Lo que el Cliente percibe. NO es lo que el carro tiene: "suena" es una
   señal, "rótula gastada" es un diagnóstico, y quien recibe no diagnostica.

   El ORDEN importa y es por GRAVEDAD, no alfabético: la primera que acierte
   encabeza el título. "En la mañana cuesta que prenda, hace un ruido y no
   arranca" tiene las dos, y titularlo "Ruido en frío" entierra lo único que
   deja al Cliente a pie. Lo que impide usar el carro va primero.

   El orden de los chips en pantalla NO sale de acá —sale del vocabulario de
   etiquetas—, así que reordenar esta lista no mueve nada de la interfaz. */
const SENALES: readonly Regla<SenalDeFalla>[] = [
  {
    clave: 'no-enciende',
    esNegativa: true,
    frases: [
      'no enciende',
      'no prende',
      'no arranca',
      'no da marcha',
      /* "tampoco" aparece en cuanto hay más de una queja —"y tampoco prende el
         aire"—, y sin estas tres la segunda cosa que dice el Cliente se queda
         sin señal reconocida. Salió de recorrer la pantalla, no de leer las
         listas. */
      'tampoco prende',
      'tampoco enciende',
      'tampoco arranca',
      'no funciona',
      'no sirve',
      'cuesta que prenda',
      'cuesta prender',
      'cuesta arrancar',
    ],
  },
  { clave: 'se-apaga', frases: ['se apaga', 'se ahoga', 'se muere'] },
  {
    clave: 'ruido',
    frases: [
      'ruido',
      'suena',
      'sonido',
      'chilla',
      'rechina',
      'traquetea',
      'cascabelea',
      'golpetea',
      'zumba',
      'pita',
      'grillo',
    ],
  },
  {
    clave: 'vibracion',
    frases: ['vibra', 'vibracion', 'tiembla', 'brinca', 'trepida', 'sacude'],
  },
  { clave: 'olor', frases: ['huele', 'olor', 'hiede', 'peste'] },
  { clave: 'humo', frases: ['humo', 'humea'] },
  {
    clave: 'luz-tablero',
    frases: [
      'luz del tablero',
      'luz de tablero',
      'testigo',
      'check engine',
      'se prendio la luz',
      'tablero',
      'aguja',
    ],
  },
  {
    clave: 'fuga',
    frases: ['fuga', 'gotea', 'chorrea', 'bota aceite', 'mancha de aceite'],
  },
  {
    clave: 'tira-agua',
    frases: ['tira agua', 'bota agua', 'pierde agua', 'entra agua'],
  },
  {
    clave: 'golpe-visible',
    frases: [
      'golpe',
      'choque',
      'chocaron',
      'abolladura',
      'hundido',
      'rayon',
      'rayado',
      'raspon',
      'estrellaron',
      'le dieron',
    ],
  },
];

const CUANDOS: readonly Regla<CuandoPasa>[] = [
  { clave: 'al-frenar', frases: ['al frenar', 'cuando freno', 'frenando'] },
  {
    clave: 'al-arrancar',
    frases: ['al arrancar', 'al prender', 'al encender', 'arrancando'],
  },
  {
    clave: 'en-frio',
    frases: ['en frio', 'en la manana', 'de manana', 'recien prendido'],
  },
  {
    clave: 'al-acelerar',
    frases: ['al acelerar', 'cuando acelero', 'acelerando', 'en subida'],
  },
  {
    clave: 'al-girar',
    frases: ['al girar', 'al doblar', 'en las curvas', 'cuando doblo'],
  },
  {
    clave: 'a-velocidad',
    frases: [
      'en carretera',
      'en la pista',
      'a alta velocidad',
      'en la autopista',
    ],
  },
  { clave: 'siempre', frases: ['siempre', 'todo el tiempo', 'constantemente'] },
];

/* La Especialidad se propone por el LÉXICO DE PIEZAS y no por la señal: un
   ruido lo hacen las tres. Lo que decide el oficio es de qué parte del carro
   se está hablando.

   El léxico es tico a propósito —"candela" por bujía, "burro" por motor de
   arranque, "faja" por correa— y es un punto de partida para corregir con el
   taller, no una lista cerrada. */
const ESPECIALIDADES: readonly Regla<Especialidad>[] = [
  {
    clave: 'electricidad',
    frases: [
      'bateria',
      'alternador',
      'burro',
      'motor de arranque',
      'fusible',
      'corriente',
      'cable',
      'luces',
      'foco',
      'bombillo',
      'direccional',
      'aire acondicionado',
      'el aire',
      'vidrios',
      'radio',
      'alarma',
      'sensor',
      'computadora',
      'escaner',
      'inyector',
      'candela',
      'bujia',
      'bobina',
      'no carga',
      'se descarga',
    ],
  },
  {
    clave: 'pintura',
    frases: [
      'pintura',
      'pintar',
      'color',
      'guardabarros',
      'capo',
      'bumper',
      'paragolpes',
      'parachoques',
      'latoneria',
      'enderezado',
      'oxido',
      'oxidado',
      'abolladura',
      'rayon',
      'rayado',
      'raspon',
      'golpe',
      'choque',
    ],
  },
  {
    clave: 'mecanica',
    frases: [
      'freno',
      'pastilla',
      'disco',
      'embrague',
      'clutch',
      'croche',
      'motor',
      'aceite',
      'caja',
      'transmision',
      'suspension',
      'amortiguador',
      'resorte',
      'direccion',
      'llanta',
      'escape',
      'radiador',
      'se calienta',
      'calentando',
      'temperatura',
      'faja',
      'correa',
      'cardan',
      'rotula',
      'terminal',
      'bomba de agua',
      'refrigerante',
    ],
  },
];

/* Con qué palabras se arma el título. Sale de lo reconocido y no de recortar
   el texto: un recorte a los 40 caracteres parte las frases por la mitad. */
const TITULO_SENAL: Record<SenalDeFalla, string> = {
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

const TITULO_CUANDO: Record<CuandoPasa, string> = {
  'al-frenar': 'al frenar',
  'al-arrancar': 'al arrancar',
  'en-frio': 'en frío',
  'al-acelerar': 'al acelerar',
  'al-girar': 'al girar',
  'a-velocidad': 'en carretera',
  siempre: 'siempre',
};

interface Acierto<T> {
  readonly clave: T;
  /** Lo que el Cliente dijo, recortado del texto original. */
  readonly dicho: string;
}

/**
 * Busca una frase y, si acierta, devuelve el trozo del texto ORIGINAL.
 *
 * Citar el original y no la entrada del diccionario es lo que hace que el
 * motivo se lea como "porque dijo «chilla»" y no como una palabra sin tildes
 * que el Cliente nunca pronunció.
 */
function buscar(
  texto: string,
  original: string,
  frase: string,
  esNegativa: boolean,
): string | null {
  const encontrado = patron(frase).exec(texto);
  if (!encontrado) return null;
  if (!esNegativa && estaNegada(texto, encontrado.index)) return null;

  /* Si normalizar hubiera cambiado la longitud, los índices no servirían para
     recortar el original. En español no pasa, pero comprobarlo cuesta una
     comparación y evita citar texto desplazado. */
  const alineado = texto.length === original.length;
  return alineado
    ? original.slice(encontrado.index, encontrado.index + encontrado[0].length)
    : encontrado[0];
}

function aciertos<T>(
  texto: string,
  original: string,
  reglas: readonly Regla<T>[],
): Acierto<T>[] {
  const encontrados: Acierto<T>[] = [];

  for (const regla of reglas) {
    for (const frase of regla.frases) {
      const dicho = buscar(texto, original, frase, regla.esNegativa ?? false);
      if (dicho) {
        encontrados.push({ clave: regla.clave, dicho });
        break;
      }
    }
  }

  return encontrados;
}

const VACIA: Interpretacion = {
  senales: [],
  cuando: [],
  especialidad: null,
  porque: [],
  titulo: '',
};

/**
 * Qué se entiende de lo que el Cliente dijo.
 *
 * Es una función pura y determinista, sin red y sin modelo: corre igual con
 * el taller sin internet, que es la mitad del tiempo. A cambio no "entiende"
 * nada — reconoce vocabulario —, y por eso todo lo que devuelve se enseña
 * como sugerencia editable con su motivo al lado, nunca como un hecho.
 *
 * Cuando dos Especialidades empatan devuelve `null`. Es a propósito: "le
 * dieron un golpe y desde entonces suena el motor" puede ser pintura o
 * mecánica, y una moneda al aire con cara de certeza es peor que un espacio
 * en blanco que quien recibe llena en dos segundos.
 */
export function interpretar(texto: string): Interpretacion {
  if (!texto.trim()) return VACIA;

  const limpio = normalizar(texto);
  const senales = aciertos(limpio, texto, SENALES);
  const cuando = aciertos(limpio, texto, CUANDOS);

  /* Gana la Especialidad con más piezas mencionadas: se cuentan las frases de
     su regla que aparecen y no las reglas que aciertan, porque "batería" y
     "no carga" en la misma queja son dos evidencias del mismo oficio. */
  const puntajes = ESPECIALIDADES.map((regla) => ({
    clave: regla.clave,
    dichos: regla.frases
      .map((f) => buscar(limpio, texto, f, false))
      .filter((d): d is string => d !== null),
  }))
    .filter((p) => p.dichos.length > 0)
    .sort((a, b) => b.dichos.length - a.dichos.length);

  const empatan =
    puntajes.length > 1 &&
    puntajes[0].dichos.length === puntajes[1].dichos.length;
  const ganadora = empatan ? null : (puntajes[0] ?? null);

  const porque = sinRepetir([
    ...senales.map((s) => s.dicho),
    ...cuando.map((c) => c.dicho),
    ...(ganadora ? [ganadora.dichos[0]] : []),
  ]);

  return {
    senales: senales.map((s) => s.clave),
    cuando: cuando.map((c) => c.clave),
    especialidad: ganadora?.clave ?? null,
    porque,
    titulo: titular(senales[0]?.clave, cuando[0]?.clave, texto),
  };
}

/**
 * Quita los motivos repetidos y los que ya están dichos dentro de otro.
 *
 * "Chilla cuando freno" acierta tres reglas y devolvía «Chilla» «cuando
 * freno» «freno»: el último no añade nada y hace que la explicación se lea
 * como un tartamudeo. Basta con que sobreviva el más largo de los que se
 * solapan.
 */
function sinRepetir(dichos: readonly string[]): readonly string[] {
  const unicos = dichos.filter((d, i) => dichos.indexOf(d) === i);
  return unicos.filter(
    (d) =>
      !unicos.some(
        (otro) => otro !== d && otro.toLowerCase().includes(d.toLowerCase()),
      ),
  );
}

function titular(
  senal: SenalDeFalla | undefined,
  cuando: CuandoPasa | undefined,
  original: string,
): string {
  /* Sin señal reconocida se usa la primera oración entera del Cliente y no un
     recorte por caracteres: es preferible un título largo a uno partido en
     mitad de una palabra. */
  if (!senal)
    return original
      .trim()
      .split(/[.;\n]/)[0]
      .trim();

  const cabeza = TITULO_SENAL[senal];
  return cuando ? `${cabeza} ${TITULO_CUANDO[cuando]}` : cabeza;
}
